const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');

const DBMock = require('./DBMock');  // Importiamo il DBMock per le ricette

const CLIENT_ID = '132257619357-ilvrflcd0vno5o18tq4n16kkpgitq523.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret';

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


// Configurazione Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Ricette',
      version: '1.0.0',
      description: 'API per la gestione di utenti e ricette',
      contact: {
        name: 'Amministratore'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Server di sviluppo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            cognome: { type: 'string' },
            data: { type: 'string', format: 'date' },
            email: { type: 'string', format: 'email' },
            favourite_dish: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] }
          }
        },
        Recipe: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            titolo: { type: 'string' },
            immagine: { type: 'string' },
            difficolta: { type: 'string' },
            tipo: { type: 'string' },
            descrizione: { type: 'string' },
            ingredienti: { type: 'array', items: { type: 'string' } },
            istruzioni: { type: 'array', items: { type: 'string' } },
            tempo: { type: 'string' },
            rating: { type: 'number' }
          }
        }
      }
    }
  },
  apis: ['./server.js'] // Il file che contiene i commenti Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors());
app.use(express.json());

// Connessione al database SQLite per utenti
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connesso al database SQLite per utenti');
});

// Creazione tabella utenti
db.run(`CREATE TABLE IF NOT EXISTS registrazione (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cognome TEXT,
    data TEXT,
    email TEXT,
    password TEXT,
    favourite_dish TEXT,
    username TEXT UNIQUE
)`, function(err) {
    if (err) {
        console.error('Errore nella creazione della tabella:', err);
        return;
    }
    
    // Controlla se la colonna 'role' esiste già
    db.all("PRAGMA table_info(registrazione)", (err, rows) => {
        if (err) {
            console.error('Errore nel controllo delle colonne:', err);
            return;
        }
        
        // Verifica se la colonna role già esiste
        const hasRoleColumn = rows.some(row => row.name === 'role');
        
        if (!hasRoleColumn) {
            // Aggiungi la colonna 'role' se non esiste
            db.run("ALTER TABLE registrazione ADD COLUMN role TEXT DEFAULT 'user'", function(err) {
                if (err) {
                    console.error('Errore nell\'aggiunta della colonna role:', err);
                    return;
                }
                console.log('Colonna role aggiunta con successo');
                // Ora possiamo creare l'admin
                createAdminIfNotExists().catch(err => {
                    console.error('Errore nella creazione dell\'utente admin:', err);
                });
            });
        } else {
            console.log('Colonna role già esistente');
            // La colonna role esiste già, possiamo creare l'admin
            createAdminIfNotExists().catch(err => {
                console.error('Errore nella creazione dell\'utente admin:', err);
            });
        }
    });
});

// Creazione tabella ricette nel mock
const mockDb = new DBMock();

// Funzione per trovare le ricette in base agli ingredienti dal DBMock
function findRecipes(ingredients) {
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase());
    
    // Esamina tutte le ricette nel DBMock
    const matches = mockDb.getAllRecipes().map(recipe => {
      // Combina ingredienti essenziali e aggiuntivi per la ricerca
      const recipeIngredients = [
        ...recipe.ingredienti_essenziali, 
        ...(recipe.ingredienti_aggiuntivi || [])
      ].map(ing => ing.toLowerCase());
      
      // Conta quanti ingredienti dalla ricerca corrispondono
      const matchCount = recipeIngredients.filter(ing => 
        normalizedIngredients.includes(ing)).length;
      
      // Calcola percentuale di corrispondenza basata sugli ingredienti essenziali
      // (diamo più peso agli ingredienti essenziali)
      const essentialMatchCount = recipe.ingredienti_essenziali
        .map(ing => ing.toLowerCase())
        .filter(ing => normalizedIngredients.includes(ing)).length;
      
      const matchPercentage = (essentialMatchCount * 1.5 + matchCount) / 
        (recipe.ingredienti_essenziali.length * 1.5 + recipeIngredients.length);
      
      return {
        recipe,
        matchCount,
        matchPercentage
      };
    });
    
    // Ordina per percentuale di corrispondenza (decrescente)
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    return matches.filter(match => match.matchCount > 0).slice(0, 3);
  }

// Gestione delle connessioni WebSocket
io.on('connection', (socket) => {
    console.log('Nuovo client connesso alla chat delle ricette');
  
    // Quando l'utente richiede una ricetta basata sugli ingredienti
    socket.on('request-recipe', async (data) => {
      console.log('Richiesta ricetta con ingredienti:', data.ingredients);
      
      // Simuliamo un ritardo per dare l'impressione che lo chef stia pensando
      socket.emit('typing');
      
      setTimeout(() => {
        const matchingRecipes = findRecipes(data.ingredients);
        
        if (matchingRecipes.length === 0) {
          socket.emit('recipe-suggestion', {
            message: "Mi dispiace, non ho trovato ricette con questi ingredienti. Prova ad aggiungere altri ingredienti!"
          });
          return;
        }
        
        // Formatta la risposta con le ricette consigliate
        let response = "Ecco cosa potresti preparare con i tuoi ingredienti:<br><br>";
        
        matchingRecipes.forEach((match, index) => {
          const recipe = match.recipe;
          response += `<strong>${index + 1}. ${recipe.titolo}</strong> (${recipe.difficolta})<br>`;
          response += `<u>Tipo</u>: ${recipe.tipo}<br>`;
          response += `<u>Ingredienti essenziali</u>: ${recipe.ingredienti_essenziali.join(', ')}<br>`;
          
          if (recipe.ingredienti_aggiuntivi && recipe.ingredienti_aggiuntivi.length > 0) {
            response += `<u>Ingredienti aggiuntivi</u>: ${recipe.ingredienti_aggiuntivi.join(', ')}<br>`;
          }
          
          response += `<u>Istruzioni</u>: ${recipe.istruzioni}<br><br>`;
        });
        
        socket.emit('recipe-suggestion', { message: response });
      }, 1500);
    });
  
    // Gestisci messaggi di chat generici
    socket.on('chat-message', (data) => {
      setTimeout(() => {
        socket.emit('recipe-suggestion', {
          message: "Per ricevere consigli sulle ricette, seleziona gli ingredienti e clicca su 'Chiedi una ricetta'."
        });
      }, 800);
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnesso dalla chat delle ricette');
    });
  });

// Controlla se l'admin esiste già, altrimenti lo crea
async function createAdminIfNotExists() {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM registrazione WHERE username = 'admin'`, async (err, user) => {
            if (err) {
                return reject(err);
            }
            if (!user) {
                try {
                    // Hash della password 'admin'
                    const hashedPassword = await bcrypt.hash('admin', 10);
                    db.run(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        ['Admin', 'User', new Date().toISOString().split('T')[0], 'admin@example.com', hashedPassword, 'Admin Food', 'admin', 'admin'],
                        function(err) {
                            if (err) {
                                return reject(err);
                            }
                            console.log('Utente admin creato con ID:', this.lastID);
                            resolve();
                        });
                } catch (err) {
                    reject(err);
                }
            } else {
                console.log('Utente admin esiste già');
                // Assicuriamoci che l'utente admin abbia il ruolo admin
                db.run(`UPDATE registrazione SET role = 'admin' WHERE username = 'admin'`, function(err) {
                    if (err) {
                        console.error('Errore nell\'aggiornamento del ruolo admin:', err);
                    } else {
                        console.log('Ruolo admin verificato');
                    }
                    resolve();
                });
            }
        });
    });
}

/**
 * @swagger
 * /registrazione:
 *   post:
 *     summary: Registra un nuovo utente
 *     description: Crea un nuovo utente nel sistema con ruolo 'user'
 *     tags: [Utenti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - cognome
 *               - data
 *               - email
 *               - password
 *               - username
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               data:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               favourite_dish:
 *                 type: string
 *               username:
 *                 type: string
 *           example:
 *             nome: "Mario"
 *             cognome: "Rossi"
 *             data: "2023-01-01"
 *             email: "mario@example.com"
 *             password: "password123"
 *             favourite_dish: "Pizza"
 *             username: "mario"
 *     responses:
 *       200:
 *         description: Utente creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: integer
 *             example:
 *               message: "Nuovo utente creato"
 *               id: 1
 *       500:
 *         description: Errore durante la registrazione
 *         content:
 *           application/json:
 *             example:
 *               error: "Errore durante la registrazione"
 */
app.post('/registrazione', async (req, res) => {
    const { nome, cognome, data, email, password, favourite_dish, username } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, cognome, data, email, hashedPassword, favourite_dish, username, 'user'],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Nuovo utente creato', id: this.lastID });
            });
    } catch (error) {
        res.status(500).json({ error: 'Errore durante la registrazione' });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticazione utente
 *     description: Autentica un utente e restituisce un token JWT. Per accedere come admin, usa username "admin" e password "admin"
 *     tags: [Utenti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             username: "mario"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login avvenuto con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *             example:
 *               message: "Login avvenuto con successo"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               email: "mario@example.com"
 *               username: "mario"
 *               role: "user"
 *       401:
 *         description: Credenziali non valide
 *         content:
 *           application/json:
 *             example:
 *               message: "Credenziali non valide"
 *       500:
 *         description: Errore durante il login
 *         content:
 *           application/json:
 *             example:
 *               error: "Errore durante il login"
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        db.get(`SELECT * FROM registrazione WHERE username = ?`, [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res.status(401).json({ message: 'Credenziali non valide' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Credenziali non valide' });
            }

            // Se user.role è null, imposta a 'user' come default
            const role = user.role || 'user';

            const token = jwt.sign({ 
                userId: user.id, 
                email: user.email, 
                role: role 
            }, JWT_SECRET, { expiresIn: '1h' });

            res.json({
                message: 'Login avvenuto con successo',
                token,
                email: user.email,
                username: user.username,
                role: role
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Errore durante il login' });
    }
});

// Middleware per proteggere le rotte con JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Accesso negato: token mancante' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Accesso negato: token non valido' });
        req.user = user;
        next();
    });
}

// Middleware per verificare il ruolo admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Accesso negato: richiesti privilegi di amministratore' });
    }
}

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Ottieni tutte le ricette
 *     description: Restituisce un elenco di ricette, opzionalmente filtrate per tipo e termine di ricerca
 *     tags: [Ricette]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtra le ricette per tipo (ad es. "primo", "secondo", "dessert")
 *         example: "primo"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cerca ricette con titolo che contiene la stringa specificata
 *         example: "pasta"
 *     responses:
 *       200:
 *         description: Elenco di ricette
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *             example:
 *               recipes:
 *                 - id: "1"
 *                   titolo: "Pasta alla carbonara"
 *                   immagine: "https://example.com/carbonara.jpg"
 *                   difficolta: "media"
 *                   tipo: "primo"
 *                   descrizione: "Un classico della cucina romana"
 *                   ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe"]
 *                   istruzioni: ["Cuocere la pasta", "Preparare il condimento", "Unire tutto"]
 *                   tempo: "20 minuti"
 *                   rating: 4.8
 *                 - id: "2"
 *                   titolo: "Tiramisù"
 *                   immagine: "https://example.com/tiramisu.jpg"
 *                   difficolta: "facile"
 *                   tipo: "dessert"
 *                   descrizione: "Dolce italiano al mascarpone e caffè"
 *                   ingredienti: ["savoiardi", "mascarpone", "uova", "caffè", "cacao"]
 *                   istruzioni: ["Preparare il caffè", "Montare le uova", "Assemblare il dolce"]
 *                   tempo: "30 minuti + 3 ore riposo"
 *                   rating: 4.9
 */
app.get('/recipes', (req, res) => {
    const { tipo, search } = req.query;
    let recipes = mockDb.getAllRecipes();

    if (tipo || search) {
        recipes = recipes.filter(recipe => {
            if (tipo && recipe.tipo !== tipo) return false;
            if (search && !recipe.titolo.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }

    res.json({ recipes: recipes });
});

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Ottieni una ricetta specifica
 *     description: Restituisce i dettagli di una ricetta con l'ID specificato
 *     tags: [Ricette]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID della ricetta
 *         example: "1"
 *     responses:
 *       200:
 *         description: Dettagli della ricetta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *             example:
 *               id: "1"
 *               titolo: "Pasta alla carbonara"
 *               immagine: "https://example.com/carbonara.jpg"
 *               difficolta: "media"
 *               tipo: "primo"
 *               descrizione: "Un classico della cucina romana"
 *               ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe"]
 *               istruzioni: ["Cuocere la pasta", "Preparare il condimento", "Unire tutto"]
 *               tempo: "20 minuti"
 *               rating: 4.8
 *       404:
 *         description: Ricetta non trovata
 *         content:
 *           application/json:
 *             example:
 *               message: "Ricetta non trovata"
 */
app.get('/recipes/:id', (req, res) => {
    const { id } = req.params;

    const recipe = mockDb.getUserById(id); 
    if (!recipe) {
        return res.status(404).json({ message: 'Ricetta non trovata' });
    }

    res.json(recipe);
});

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Aggiungi una nuova ricetta
 *     description: Crea una nuova ricetta nel sistema
 *     tags: [Ricette]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titolo
 *               - tipo
 *               - descrizione
 *               - ingredienti
 *               - istruzioni
 *             properties:
 *               titolo:
 *                 type: string
 *               immagine:
 *                 type: string
 *               difficolta:
 *                 type: string
 *               tipo:
 *                 type: string
 *               descrizione:
 *                 type: string
 *               ingredienti:
 *                 type: array
 *                 items:
 *                   type: string
 *               istruzioni:
 *                 type: array
 *                 items:
 *                   type: string
 *               tempo:
 *                 type: string
 *               rating:
 *                 type: number
 *           example:
 *             titolo: "Pasta alla carbonara"
 *             immagine: "https://example.com/carbonara.jpg"
 *             difficolta: "media"
 *             tipo: "primo"
 *             descrizione: "Un classico della cucina romana"
 *             ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe"]
 *             istruzioni: ["Cuocere la pasta", "Preparare il condimento", "Unire tutto"]
 *             tempo: "20 minuti"
 *             rating: 4.8
 *     responses:
 *       200:
 *         description: Ricetta creata con successo
 *         content:
 *           application/json:
 *             example:
 *               message: "Nuova ricetta creata"
 *               recipe:
 *                 id: "3"
 *                 titolo: "Pasta alla carbonara"
 *                 immagine: "https://example.com/carbonara.jpg"
 *                 difficolta: "media"
 *                 tipo: "primo"
 *                 descrizione: "Un classico della cucina romana"
 *                 ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe"]
 *                 istruzioni: ["Cuocere la pasta", "Preparare il condimento", "Unire tutto"]
 *                 tempo: "20 minuti"
 *                 rating: 4.8
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido o utente non autorizzato
 *       500:
 *         description: Errore durante la creazione della ricetta
 *         content:
 *           application/json:
 *             example:
 *               error: "Errore durante la creazione della ricetta"
 */
app.post('/recipes', authenticateToken, (req, res) => {
    const { titolo, immagine, difficolta, tipo, descrizione, ingredienti, istruzioni, tempo, rating } = req.body;

    try {
        const newRecipe = mockDb.createUser({
            titolo, immagine, difficolta, tipo, descrizione, ingredienti, istruzioni, tempo, rating
        }); 
        res.json({ message: 'Nuova ricetta creata', recipe: newRecipe });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante la creazione della ricetta' });
    }
});

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Elimina una ricetta (solo admin)
 *     description: Elimina una ricetta esistente. Richiede privilegi di amministratore.
 *     tags: [Ricette]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID della ricetta da eliminare
 *         example: "1"
 *     responses:
 *       200:
 *         description: Ricetta eliminata con successo
 *         content:
 *           application/json:
 *             example:
 *               message: "Ricetta eliminata con successo"
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Accesso negato - Richiesti privilegi di amministratore
 *       404:
 *         description: Ricetta non trovata
 *         content:
 *           application/json:
 *             example:
 *               message: "Ricetta non trovata"
 *       500:
 *         description: Errore del server
 */
app.delete('/recipes/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    
    try {
        // Verifica che la ricetta esista
        const recipe = mockDb.getUserById(id);
        if (!recipe) {
            return res.status(404).json({ message: 'Ricetta non trovata' });
        }
        
        // Implementazione della funzione di eliminazione nella classe mockDb
        // Assumiamo che esista un metodo deleteUser nel mock
        mockDb.deleteUser(id);
        
        res.json({ message: 'Ricetta eliminata con successo' });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante l\'eliminazione della ricetta' });
    }
});

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Aggiorna una ricetta (solo admin)
 *     description: Aggiorna una ricetta esistente. Richiede privilegi di amministratore.
 *     tags: [Ricette]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID della ricetta da aggiornare
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titolo:
 *                 type: string
 *               immagine:
 *                 type: string
 *               difficolta:
 *                 type: string
 *               tipo:
 *                 type: string
 *               descrizione:
 *                 type: string
 *               ingredienti:
 *                 type: array
 *                 items:
 *                   type: string
 *               istruzioni:
 *                 type: array
 *                 items:
 *                   type: string
 *               tempo:
 *                 type: string
 *               rating:
 *                 type: number
 *           example:
 *             titolo: "Pasta alla carbonara (aggiornata)"
 *             immagine: "https://example.com/carbonara_updated.jpg"
 *             difficolta: "facile"
 *             tipo: "primo"
 *             descrizione: "La versione migliorata della carbonara"
 *             ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe nero"]
 *             istruzioni: ["Cuocere la pasta al dente", "Preparare il condimento", "Unire tutto delicatamente"]
 *             tempo: "15 minuti"
 *             rating: 5.0
 *     responses:
 *       200:
 *         description: Ricetta aggiornata con successo
 *         content:
 *           application/json:
 *             example:
 *               message: "Ricetta aggiornata con successo"
 *               recipe:
 *                 id: "1"
 *                 titolo: "Pasta alla carbonara (aggiornata)"
 *                 immagine: "https://example.com/carbonara_updated.jpg"
 *                 difficolta: "facile"
 *                 tipo: "primo"
 *                 descrizione: "La versione migliorata della carbonara"
 *                 ingredienti: ["pasta", "uova", "pecorino", "guanciale", "pepe nero"]
 *                 istruzioni: ["Cuocere la pasta al dente", "Preparare il condimento", "Unire tutto delicatamente"]
 *                 tempo: "15 minuti"
 *                 rating: 5.0
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Accesso negato - Richiesti privilegi di amministratore
 *       404:
 *         description: Ricetta non trovata
 *       500:
 *         description: Errore del server
 */
app.put('/recipes/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    try {
        // Verifica che la ricetta esista
        const recipe = mockDb.getUserById(id);
        if (!recipe) {
            return res.status(404).json({ message: 'Ricetta non trovata' });
        }
        
        // Aggiorna la ricetta nel mock
        // Assumiamo che esista un metodo updateUser nel mock
        const updatedRecipe = mockDb.updateUser(id, updateData);
        
        res.json({ 
            message: 'Ricetta aggiornata con successo',
            recipe: updatedRecipe 
        });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante l\'aggiornamento della ricetta' });
    }
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Ottieni tutti gli utenti (solo admin)
 *     description: Restituisce un elenco di tutti gli utenti registrati. Richiede privilegi di amministratore.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Elenco di tutti gli utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *             example:
 *               users:
 *                 - id: 1
 *                   nome: "Admin"
 *                   cognome: "User"
 *                   email: "admin@example.com"
 *                   username: "admin"
 *                   favourite_dish: "Admin Food"
 *                   role: "admin"
 *                 - id: 2
 *                   nome: "Mario"
 *                   cognome: "Rossi"
 *                   email: "mario@example.com"
 *                   username: "mario"
 *                   favourite_dish: "Pizza"
 *                   role: "user"
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Accesso negato - Richiesti privilegi di amministratore
 *       500:
 *         description: Errore del server
 */
app.get('/admin/users', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT id, nome, cognome, data, email, username, favourite_dish, role FROM registrazione`, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
        }
        res.json({ users });
    });
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Elimina un utente (solo admin)
 *     description: Elimina un utente esistente. Richiede privilegi di amministratore.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'utente da eliminare
 *         example: 2
 *     responses:
 *       200:
 *         description: Utente eliminato con successo
 *         content:
 *           application/json:
 *             example:
 *               message: "Utente eliminato con successo"
 *       400:
 *         description: Non puoi eliminare l'account admin
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Accesso negato - Richiesti privilegi di amministratore
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server
 */
app.delete('/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;
    
    // Controlla se si sta cercando di eliminare l'account admin
    db.get(`SELECT role FROM registrazione WHERE id = ?`, [id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Non puoi eliminare l\'account admin' });
        }
        
        // Elimina l'utente
        db.run(`DELETE FROM registrazione WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Utente non trovato' });
            }
            res.json({ message: 'Utente eliminato con successo' });
        });
    });
});

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Autenticazione con Google
 *     description: Autentica un utente tramite Google OAuth
 *     tags: [Utenti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *           example:
 *             idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiYzEyMyIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Autenticazione riuscita
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               message: "Login con Google riuscito"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 2
 *                 nome: "Mario"
 *                 cognome: "Rossi"
 *                 email: "mario.rossi@gmail.com"
 *                 username: "mario.rossi"
 *                 favourite_dish: "Pizza"
 *                 role: "user"
 *       401:
 *         description: Token ID non valido
 *         content:
 *           application/json:
 *             example:
 *               message: "Token ID non valido"
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             example:
 *               error: "Errore nel database"
 */
app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;

    try {
        // Verifica il token ID con Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID, 
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const nome = payload.given_name || '';
        const cognome = payload.family_name || '';
        const username = email.split('@')[0];
        const favourite_dish = '';
        const data = new Date().toISOString().split('T')[0];

        console.log('Utente verificato:', payload);

        db.get(`SELECT * FROM registrazione WHERE email = ?`, [email], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel database' });
            }

            if (!user) {
                // Se l'utente non esiste, crealo
                db.run(
                    `INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [nome, cognome, data, email, null, favourite_dish, username, 'user'],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: 'Errore nel salvataggio dell\'utente' });
                        }
                        const userId = this.lastID;
                        const token = jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

                        res.json({ 
                            message: 'Registrazione con Google completata',
                            token,
                            user: { id: userId, nome, cognome, email, username, favourite_dish, role: 'user' }
                        });
                    }
                );
            } else {
                // L'utente esiste già, genera un token JWT
                const token = jwt.sign({ userId: user.id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });

                res.json({ 
                    message: 'Login con Google riuscito', 
                    token,
                    user 
                });
            }
        });
    } catch (error) {
        console.error('Errore nella verifica del token ID:', error);
        res.status(401).json({ message: 'Token ID non valido' });
    }
});

/**
 * @swagger
 * /userinfo:
 *   get:
 *     summary: Ottieni informazioni utente
 *     description: Restituisce le informazioni dell'utente autenticato
 *     tags: [Utenti]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informazioni utente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               nome: "Mario"
 *               cognome: "Rossi"
 *               email: "mario@example.com"
 *               username: "mario"
 *               favourite_dish: "Pizza"
 *               data: "2023-01-01"
 *               role: "user"
 *       401:
 *         description: Token mancante
 *       403:
 *         description: Token non valido
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             example:
 *               error: "Utente non trovato"
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             example:
 *               error: "Errore nel recupero delle informazioni utente"
 */
app.get('/userinfo', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.get(`SELECT nome, cognome, email, username, favourite_dish, data, role FROM registrazione WHERE id = ?`, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero delle informazioni utente' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        res.json(row); // Restituisce le informazioni dell'utente
    });
});

const path = require('path');

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Ottieni dati dashboard admin
 *     description: Restituisce i dati di riepilogo per la dashboard dell'amministratore
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dati dashboard
 *         content:
 *           application/json:
 *             example:
 *               totalUsers: 10
 *               totalRecipes: 25
 *               recentUsers: [
 *                 {id: 8, username: "user1", email: "user1@example.com", data: "2023-03-15"},
 *                 {id: 9, username: "user2", email: "user2@example.com", data: "2023-03-16"},
 *                 {id: 10, username: "user3", email: "user3@example.com", data: "2023-03-17"}
 *               ]
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Accesso negato - Richiesti privilegi di amministratore
 */
app.get('/admin/dashboard', authenticateToken, isAdmin, (req, res) => {
    // Recupera il numero totale di utenti
    db.get('SELECT COUNT(*) as totalUsers FROM registrazione', (err, userCount) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero dei dati utenti' });
        }
        
        // Recupera gli ultimi 5 utenti registrati
        db.all('SELECT id, username, email, data FROM registrazione ORDER BY id DESC LIMIT 5', (err, recentUsers) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel recupero degli utenti recenti' });
            }
            
            // Recupera il numero totale di ricette
            const totalRecipes = mockDb.getAllRecipes().length;
            
            res.json({
                totalUsers: userCount.totalUsers,
                totalRecipes: totalRecipes,
                recentUsers: recentUsers
            });
        });
    });
});

server.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
    console.log(`Server API in esecuzione su http://localhost:${port}`);
    console.log(`Documentazione Swagger disponibile su http://localhost:${port}/api-docs`);
});


// Avvio del server
// app.listen(port, () => {
    //console.log(`Server API in esecuzione su http://localhost:${port}`);
    //console.log(`Documentazione Swagger disponibile su http://localhost:${port}/api-docs`);
//});