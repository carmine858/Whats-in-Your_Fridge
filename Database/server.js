const express = require('express');
// Replace sqlite3 with better-sqlite3
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

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
  apis: [path.join(__dirname, 'server.js')] // Utilizzo di path.join per percorso assoluto
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Aggiungi configurazioni CORS e JSON con limite aumentato
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'], // Consenti richieste dal frontend Vue
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Aumentato il limite a 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Anche per dati URL-encoded

// Connessione al database SQLite per utenti
// Replace the sqlite3 connection with better-sqlite3
const db = new Database('./database.db', { verbose: console.log });
console.log('Connesso al database SQLite per utenti');

// Creazione tabella utenti - Convert to better-sqlite3 syntax
try {
    db.exec(`CREATE TABLE IF NOT EXISTS registrazione (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        cognome TEXT,
        data TEXT,
        email TEXT,
        password TEXT,
        favourite_dish TEXT,
        username TEXT UNIQUE,
        role TEXT DEFAULT 'user'
    )`);
    
    console.log('Tabella registrazione verificata o creata');
    
    // Create user_recipes table if it doesn't exist
    db.exec(`CREATE TABLE IF NOT EXISTS user_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        image TEXT,
        difficulty TEXT,
        type TEXT,
        description TEXT,
        essential_ingredients TEXT,
        additional_ingredients TEXT,
        instructions TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES registrazione(id)
    )`);
    
    console.log('Tabella user_recipes verificata o creata');
    
    // Check if role column exists
    const tableInfo = db.prepare("PRAGMA table_info(registrazione)").all();
    const hasRoleColumn = tableInfo.some(column => column.name === 'role');
    
    if (!hasRoleColumn) {
        // Add role column if it doesn't exist
        db.exec("ALTER TABLE registrazione ADD COLUMN role TEXT DEFAULT 'user'");
        console.log('Colonna role aggiunta con successo');
    } else {
        console.log('Colonna role già esistente');
    }
    
    // Create admin user if not exists
    createAdminIfNotExists().catch(err => {
        console.error('Errore nella creazione dell\'utente admin:', err);
    });
    
} catch (err) {
    console.error('Errore nella creazione della tabella:', err);
}

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
    
    let typingTimeout;
    
    // Quando l'utente richiede una ricetta basata sugli ingredienti
    socket.on('request-recipe', async (data) => {
      console.log('Richiesta ricetta con ingredienti:', data.ingredients);
      
      // Simuliamo un ritardo per dare l'impressione che lo chef stia pensando
      socket.emit('typing', { status: true });
      
      setTimeout(() => {
        const matchingRecipes = findRecipes(data.ingredients, data.filters || {});
        socket.emit('typing', { status: false });
        
        if (matchingRecipes.length === 0) {
          socket.emit('recipe-suggestion', {
            message: "Mi dispiace, non ho trovato ricette con questi ingredienti. Prova ad aggiungere altri ingredienti o modificare i filtri!"
          });
          return;
        }
        
        // Formatta la risposta con le ricette consigliate
        let response = "Ecco cosa potresti preparare con i tuoi ingredienti:<br><br>";
        
        matchingRecipes.forEach((match, index) => {
          const recipe = match.recipe;
          response += `<strong>${index + 1}. ${recipe.titolo}</strong> (${recipe.difficolta}) - Compatibilità: ${Math.round(match.matchPercentage * 100)}%<br>`;
          response += `<u>Tipo</u>: ${recipe.tipo}<br>`;
          response += `<u>Ingredienti essenziali</u>: ${recipe.ingredienti_essenziali.join(', ')}<br>`;
          
          if (recipe.ingredienti_aggiuntivi && recipe.ingredienti_aggiuntivi.length > 0) {
            response += `<u>Ingredienti aggiuntivi</u>: ${recipe.ingredienti_aggiuntivi.join(', ')}<br>`;
          }
          
          response += `<u>Istruzioni</u>: ${recipe.istruzioni}<br><br>`;
        });
        
        socket.emit('recipe-suggestion', { 
          message: response,
          recipes: matchingRecipes.map(match => ({
            ...match.recipe,
            matchPercentage: Math.round(match.matchPercentage * 100)
          }))
        });
      }, 1500);
    });
  
    // Gestisci messaggi di chat generici
    socket.on('chat-message', (data) => {
      // Indica che lo chef sta digitando
      socket.emit('typing', { status: true });
      
      // Analizza il messaggio per capire se è una richiesta di ricetta
      const message = data.message.toLowerCase();
      const isRecipeRequest = message.includes('ricetta') || 
                             message.includes('cucinare') || 
                             message.includes('preparare') ||
                             message.includes('ingredienti');
      
      setTimeout(() => {
        socket.emit('typing', { status: false });
        
        if (isRecipeRequest) {
          // Estrai possibili ingredienti dal messaggio
          const ingredients = extractIngredientsFromMessage(message);
          
          if (ingredients.length > 0) {
            // Troviamo ricette con gli ingredienti menzionati
            const matchingRecipes = findRecipes(ingredients);
            
            if (matchingRecipes.length > 0) {
              let response = "Ecco alcune ricette che potrebbero interessarti:<br><br>";
              
              matchingRecipes.slice(0, 2).forEach((match, index) => {
                const recipe = match.recipe;
                response += `<strong>${index + 1}. ${recipe.titolo}</strong> (${recipe.difficolta})<br>`;
                response += `<u>Ingredienti</u>: ${recipe.ingredienti_essenziali.join(', ')}<br><br>`;
              });
              
              response += "Vuoi ricevere la ricetta completa?";
              
              socket.emit('recipe-suggestion', { message: response });
              return;
            }
          }
          
          socket.emit('recipe-suggestion', {
            message: "Per trovare ricette specifiche, seleziona gli ingredienti dal pannello e clicca 'Chiedi una ricetta'. Puoi anche specificare preferenze dietetiche come vegetariano, vegano o senza glutine."
          });
        } else {
          socket.emit('recipe-suggestion', {
            message: "Sono il tuo chef virtuale, posso aiutarti a trovare ricette in base agli ingredienti che hai disponibili. Quali ingredienti hai nel frigo oggi?"
          });
        }
      }, 800);
    });
    
    // Gestisci l'indicatore di digitazione dell'utente
    socket.on('user-typing', (data) => {
      // Se avessimo una chat di gruppo potremmo inviare questo stato ad altri utenti
      console.log('Utente sta digitando:', data);
    });
    
    // Gestisci la richiesta di dettagli ricetta
    socket.on('recipe-details', (data) => {
      const recipeId = data.recipeId;
      const recipe = mockDb.getRecipeById(recipeId);
      
      if (recipe) {
        socket.emit('recipe-details-response', { recipe });
      } else {
        socket.emit('recipe-suggestion', { 
          message: "Mi dispiace, non riesco a trovare i dettagli di questa ricetta." 
        });
      }
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnesso dalla chat delle ricette');
    });
  });

// Funzione per estrarre potenziali ingredienti da un messaggio
function extractIngredientsFromMessage(message) {
  // Lista di ingredienti comuni che potrebbero essere menzionati
  const commonIngredients = [
    'pomodori', 'pasta', 'riso', 'patate', 'carote', 'cipolla', 'aglio', 
    'zucchine', 'melanzane', 'peperoni', 'funghi', 'carne', 'pollo', 
    'manzo', 'maiale', 'tonno', 'salmone', 'pesce', 'formaggio', 'mozzarella',
    'parmigiano', 'uova', 'latte', 'panna', 'burro', 'olio', 'farina',
    'zucchero', 'sale', 'pepe'
  ];
  
  // Cerca ingredienti nel messaggio
  return commonIngredients.filter(ingredient => 
    message.includes(ingredient)
  );
}

// Funzione per trovare le ricette in base agli ingredienti dal DBMock con filtri
function findRecipes(ingredients, filters = {}) {
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase());
    
    // Esamina tutte le ricette nel DBMock
    const matches = mockDb.getAllRecipes()
      .filter(recipe => {
        // Applica filtri dietetici
        if (filters.vegetarian && recipe.contieneCarne) return false;
        if (filters.vegan && (recipe.contieneCarne || recipe.contieneLattici)) return false;
        if (filters.glutenFree && recipe.contieneGlutine) return false;
        return true;
      })
      .map(recipe => {
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

// Controlla se l'admin esiste già, altrimenti lo crea - Update to better-sqlite3 syntax
async function createAdminIfNotExists() {
    return new Promise((resolve, reject) => {
        try {
            // Check if admin user exists
            const admin = db.prepare(`SELECT * FROM registrazione WHERE username = ?`).get('admin');
            
            if (!admin) {
                // Hash the password
                bcrypt.hash('admin', 10, (err, hashedPassword) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    // Insert admin user
                    const stmt = db.prepare(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                        
                    const result = stmt.run(
                        'Admin', 
                        'User', 
                        new Date().toISOString().split('T')[0], 
                        'admin@example.com', 
                        hashedPassword, 
                        'Admin Food', 
                        'admin', 
                        'admin'
                    );
                    
                    console.log('Utente admin creato con ID:', result.lastInsertRowid);
                    resolve();
                });
            } else {
                console.log('Utente admin esiste già');
                // Ensure admin user has admin role
                const updateStmt = db.prepare(`UPDATE registrazione SET role = 'admin' WHERE username = 'admin'`);
                updateStmt.run();
                console.log('Ruolo admin verificato');
                resolve();
            }
        } catch (err) {
            reject(err);
        }
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
        
        const stmt = db.prepare(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        const result = stmt.run(nome, cognome, data, email, hashedPassword, favourite_dish, username, 'user');
        
        res.json({ message: 'Nuovo utente creato', id: result.lastInsertRowid });
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
        const user = db.prepare(`SELECT * FROM registrazione WHERE username = ?`).get(username);
        
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
    // Convertire l'id da stringa a numero
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
        return res.status(400).json({ message: 'ID ricetta non valido' });
    }

    const recipe = mockDb.getRecipeById(numericId); 
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
    const { titolo, immagine, difficolta, tipo, descrizione, ingredienti_essenziali, ingredienti_aggiuntivi, istruzioni, tempo, rating } = req.body;

    try {
        const newRecipe = mockDb.createRecipe({
            titolo, 
            Image: immagine, 
            difficolta, 
            tipo, 
            descrizione, 
            ingredienti_essenziali: ingredienti_essenziali || [], 
            ingredienti_aggiuntivi: ingredienti_aggiuntivi || [], 
            istruzioni
        }); 
        res.json({ message: 'Nuova ricetta creata', recipe: newRecipe });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante la creazione della ricetta: ' + err.message });
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
        // Convertire l'id da stringa a numero
        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId)) {
            return res.status(400).json({ message: 'ID ricetta non valido' });
        }
        
        // Verifica che la ricetta esista
        const recipe = mockDb.getRecipeById(numericId);
        if (!recipe) {
            return res.status(404).json({ message: 'Ricetta non trovata' });
        }
        
        // Eliminazione della ricetta
        const result = mockDb.deleteRecipe(numericId);
        
        if (result) {
            res.json({ message: 'Ricetta eliminata con successo' });
        } else {
            res.status(500).json({ message: 'Errore durante l\'eliminazione della ricetta' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Errore durante l\'eliminazione della ricetta: ' + err.message });
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
        // Convertire l'id da stringa a numero
        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId)) {
            return res.status(400).json({ message: 'ID ricetta non valido' });
        }
        
        // Verifica che la ricetta esista
        const recipe = mockDb.getRecipeById(numericId);
        if (!recipe) {
            return res.status(404).json({ message: 'Ricetta non trovata' });
        }
        
        // Aggiorna la ricetta nel mock
        const updatedRecipe = mockDb.updateRecipe(numericId, updateData);
        
        if (!updatedRecipe) {
            return res.status(500).json({ message: 'Errore durante l\'aggiornamento della ricetta' });
        }
        
        res.json({ 
            message: 'Ricetta aggiornata con successo',
            recipe: updatedRecipe 
        });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante l\'aggiornamento della ricetta: ' + err.message });
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
    try {
        const users = db.prepare(`SELECT id, nome, cognome, data, email, username, favourite_dish, role FROM registrazione`).all();
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero degli utenti' });
    }
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
    
    try {
        // Controlla se si sta cercando di eliminare l'account admin
        const user = db.prepare(`SELECT role FROM registrazione WHERE id = ?`).get(id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Non puoi eliminare l\'account admin' });
        }
        
        // Elimina l'utente
        const result = db.prepare(`DELETE FROM registrazione WHERE id = ?`).run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        
        res.json({ message: 'Utente eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente' });
    }
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

        const user = db.prepare(`SELECT * FROM registrazione WHERE email = ?`).get(email);
        
        if (!user) {
            // Se l'utente non esiste, crealo
            const stmt = db.prepare(
                `INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username, role)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            );
            
            const result = stmt.run(nome, cognome, data, email, null, favourite_dish, username, 'user');
            
            const userId = result.lastInsertRowid;
            const token = jwt.sign({ userId, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

            res.json({ 
                message: 'Registrazione con Google completata',
                token,
                user: { id: userId, nome, cognome, email, username, favourite_dish, role: 'user' }
            });
        } else {
            // L'utente esiste già, genera un token JWT
            const token = jwt.sign({ userId: user.id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1h' });

            res.json({ 
                message: 'Login con Google riuscito', 
                token,
                user 
            });
        }
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

    try {
        const user = db.prepare(`SELECT nome, cognome, email, username, favourite_dish, data, role FROM registrazione WHERE id = ?`).get(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        res.json(user); // Restituisce le informazioni dell'utente
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero delle informazioni utente' });
    }
});

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
    try {
        // Recupera il numero totale di utenti
        const userCount = db.prepare('SELECT COUNT(*) as totalUsers FROM registrazione').get();
        
        // Recupera gli ultimi 5 utenti registrati
        const recentUsers = db.prepare('SELECT id, username, email, data FROM registrazione ORDER BY id DESC LIMIT 5').all();
        
        // Recupera il numero totale di ricette
        const totalRecipes = mockDb.getAllRecipes().length;
        
        res.json({
            totalUsers: userCount.totalUsers,
            totalRecipes: totalRecipes,
            recentUsers: recentUsers
        });
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei dati dashboard' });
    }
});

/**
 * @swagger
 * /shopping-list:
 *   get:
 *     summary: Ottieni la lista della spesa dell'utente
 *     description: Restituisce la lista della spesa dell'utente autenticato
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista della spesa
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 */
app.get('/shopping-list', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    try {
        // Verifica se la tabella esiste
        const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='shopping_list'`).get();
        
        if (!tableExists) {
            // Crea la tabella se non esiste
            db.exec(`CREATE TABLE shopping_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                item_name TEXT,
                quantity TEXT,
                category TEXT,
                expiry_date TEXT,
                purchased BOOLEAN DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES registrazione(id)
            )`);
        }
        
        // Ottieni la lista della spesa dell'utente
        const items = db.prepare(`
            SELECT id, item_name, quantity, category, expiry_date, purchased 
            FROM shopping_list 
            WHERE user_id = ?
            ORDER BY 
                CASE WHEN purchased = 0 THEN 0 ELSE 1 END,
                CASE 
                    WHEN expiry_date IS NULL THEN 999999 
                    ELSE julianday(expiry_date) - julianday('now') 
                END
        `).all(userId);
        
        res.json({ items });
    } catch (err) {
        console.error('Errore nel recupero della lista della spesa:', err);
        res.status(500).json({ error: 'Errore nel recupero della lista della spesa' });
    }
});

/**
 * @swagger
 * /shopping-list:
 *   post:
 *     summary: Aggiungi un elemento alla lista della spesa
 *     description: Aggiunge un nuovo elemento alla lista della spesa dell'utente
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_name
 *             properties:
 *               item_name:
 *                 type: string
 *               quantity:
 *                 type: string
 *               category:
 *                 type: string
 *               expiry_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Elemento aggiunto con successo
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 */
app.post('/shopping-list', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { item_name, quantity, category, expiry_date } = req.body;
    
    if (!item_name) {
        return res.status(400).json({ error: 'Nome elemento richiesto' });
    }
    
    try {
        const stmt = db.prepare(`
            INSERT INTO shopping_list (user_id, item_name, quantity, category, expiry_date)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(userId, item_name, quantity || null, category || null, expiry_date || null);
        
        res.status(201).json({
            message: 'Elemento aggiunto con successo',
            id: result.lastInsertRowid
        });
    } catch (err) {
        console.error('Errore nell\'aggiunta dell\'elemento alla lista della spesa:', err);
        res.status(500).json({ error: 'Errore nell\'aggiunta dell\'elemento alla lista della spesa' });
    }
});

/**
 * @swagger
 * /shopping-list/{id}:
 *   put:
 *     summary: Aggiorna un elemento della lista della spesa
 *     description: Aggiorna un elemento esistente nella lista della spesa
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'elemento da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *               quantity:
 *                 type: string
 *               category:
 *                 type: string
 *               expiry_date:
 *                 type: string
 *                 format: date
 *               purchased:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Elemento aggiornato con successo
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 *       404:
 *         description: Elemento non trovato
 */
app.put('/shopping-list/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;
    const { item_name, quantity, category, expiry_date, purchased } = req.body;
    
    try {
        // Verifica se l'elemento esiste e appartiene all'utente
        const item = db.prepare(`
            SELECT * FROM shopping_list WHERE id = ? AND user_id = ?
        `).get(itemId, userId);
        
        if (!item) {
            return res.status(404).json({ error: 'Elemento non trovato' });
        }
        
        // Costruisci la query di aggiornamento dinamicamente
        let updates = [];
        let params = [];
        
        if (item_name !== undefined) {
            updates.push('item_name = ?');
            params.push(item_name);
        }
        
        if (quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(quantity);
        }
        
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        
        if (expiry_date !== undefined) {
            updates.push('expiry_date = ?');
            params.push(expiry_date);
        }
        
        if (purchased !== undefined) {
            updates.push('purchased = ?');
            params.push(purchased ? 1 : 0);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nessun campo da aggiornare' });
        }
        
        // Aggiungi itemId e userId ai parametri
        params.push(itemId);
        params.push(userId);
        
        const stmt = db.prepare(`
            UPDATE shopping_list
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `);
        
        const result = stmt.run(...params);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Elemento non trovato o nessuna modifica effettuata' });
        }
        
        res.json({ message: 'Elemento aggiornato con successo' });
    } catch (err) {
        console.error('Errore nell\'aggiornamento dell\'elemento della lista della spesa:', err);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'elemento della lista della spesa' });
    }
});

/**
 * @swagger
 * /shopping-list/{id}:
 *   delete:
 *     summary: Elimina un elemento dalla lista della spesa
 *     description: Elimina un elemento esistente dalla lista della spesa
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'elemento da eliminare
 *     responses:
 *       200:
 *         description: Elemento eliminato con successo
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 *       404:
 *         description: Elemento non trovato
 */
app.delete('/shopping-list/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;
    
    try {
        // Verifica se l'elemento esiste e appartiene all'utente
        const item = db.prepare(`
            SELECT * FROM shopping_list WHERE id = ? AND user_id = ?
        `).get(itemId, userId);
        
        if (!item) {
            return res.status(404).json({ error: 'Elemento non trovato' });
        }
        
        const stmt = db.prepare(`
            DELETE FROM shopping_list
            WHERE id = ? AND user_id = ?
        `);
        
        const result = stmt.run(itemId, userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Elemento non trovato' });
        }
        
        res.json({ message: 'Elemento eliminato con successo' });
    } catch (err) {
        console.error('Errore nell\'eliminazione dell\'elemento dalla lista della spesa:', err);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'elemento dalla lista della spesa' });
    }
});

/**
 * @swagger
 * /shopping-list/toggle/{id}:
 *   patch:
 *     summary: Cambia lo stato di acquisto di un elemento
 *     description: Cambia lo stato di acquisto di un elemento della lista della spesa
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID dell'elemento da aggiornare
 *     responses:
 *       200:
 *         description: Stato di acquisto aggiornato con successo
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 *       404:
 *         description: Elemento non trovato
 */
app.patch('/shopping-list/toggle/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const itemId = req.params.id;
    
    try {
        // Ottieni lo stato attuale dell'elemento
        const item = db.prepare(`
            SELECT purchased FROM shopping_list WHERE id = ? AND user_id = ?
        `).get(itemId, userId);
        
        if (!item) {
            return res.status(404).json({ error: 'Elemento non trovato' });
        }
        
        // Inverte lo stato di acquisto
        const newPurchasedState = item.purchased === 0 ? 1 : 0;
        
        const stmt = db.prepare(`
            UPDATE shopping_list
            SET purchased = ?
            WHERE id = ? AND user_id = ?
        `);
        
        const result = stmt.run(newPurchasedState, itemId, userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Elemento non trovato o nessuna modifica effettuata' });
        }
        
        res.json({
            message: 'Stato di acquisto aggiornato con successo',
            purchased: newPurchasedState === 1
        });
    } catch (err) {
        console.error('Errore nell\'aggiornamento dello stato di acquisto:', err);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato di acquisto' });
    }
});

/**
 * @swagger
 * /shopping-list/expiry-alerts:
 *   get:
 *     summary: Ottieni avvisi per ingredienti in scadenza
 *     description: Restituisce gli ingredienti che stanno per scadere o sono già scaduti
 *     tags: [Lista della Spesa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avvisi di scadenza
 *       401:
 *         description: Token non fornito
 *       403:
 *         description: Token non valido
 */
app.get('/shopping-list/expiry-alerts', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Ottieni gli ingredienti che scadono entro 3 giorni o sono già scaduti
        const expiringItems = db.prepare(`
            SELECT id, item_name, quantity, category, expiry_date, 
                julianday(expiry_date) - julianday(?) AS days_left
            FROM shopping_list 
            WHERE user_id = ? 
                AND purchased = 1
                AND expiry_date IS NOT NULL
                AND julianday(expiry_date) - julianday(?) <= 3
            ORDER BY days_left
        `).all(today, userId, today);
        
        const alerts = {
            expired: expiringItems.filter(item => item.days_left < 0).map(item => ({
                ...item,
                status: 'expired',
                message: `${item.item_name} è scaduto il ${item.expiry_date}!`
            })),
            today: expiringItems.filter(item => item.days_left >= 0 && item.days_left < 1).map(item => ({
                ...item,
                status: 'today',
                message: `${item.item_name} scade oggi!`
            })),
            soon: expiringItems.filter(item => item.days_left >= 1 && item.days_left <= 3).map(item => ({
                ...item,
                status: 'soon',
                message: `${item.item_name} scade fra ${Math.ceil(item.days_left)} giorni`
            }))
        };
        
        res.json({ alerts });
    } catch (err) {
        console.error('Errore nel recupero degli avvisi di scadenza:', err);
        res.status(500).json({ error: 'Errore nel recupero degli avvisi di scadenza' });
    }
});

/**
 * @swagger
 * /user-recipes:
 *   get:
 *     summary: Get user recipes
 *     description: Retrieves all recipes created by the authenticated user
 *     tags: [User Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.get('/user-recipes', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    try {
        const recipes = db.prepare(`
            SELECT id, title, image, difficulty, type, description, 
                   essential_ingredients, additional_ingredients, instructions, created_at
            FROM user_recipes 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);
        
        // Parse JSON strings back to arrays
        const formattedRecipes = recipes.map(recipe => ({
            ...recipe,
            essential_ingredients: recipe.essential_ingredients ? JSON.parse(recipe.essential_ingredients) : [],
            additional_ingredients: recipe.additional_ingredients ? JSON.parse(recipe.additional_ingredients) : []
        }));
        
        res.json({ recipes: formattedRecipes });
    } catch (err) {
        console.error('Error fetching user recipes:', err);
        res.status(500).json({ error: 'Failed to fetch user recipes' });
    }
});

/**
 * @swagger
 * /user-recipes:
 *   post:
 *     summary: Add a new user recipe
 *     description: Add a new recipe created by the user
 *     tags: [User Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
app.post('/user-recipes', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { title, image, difficulty, type, description, essential_ingredients, additional_ingredients, instructions } = req.body;
    
    if (!title || !description || !instructions) {
        return res.status(400).json({ error: 'Title, description and instructions are required' });
    }
    
    try {
        // Convert arrays to JSON strings for storage
        const essentialIngredientsJSON = essential_ingredients ? JSON.stringify(essential_ingredients) : '[]';
        const additionalIngredientsJSON = additional_ingredients ? JSON.stringify(additional_ingredients) : '[]';
        
        const stmt = db.prepare(`
            INSERT INTO user_recipes 
            (user_id, title, image, difficulty, type, description, essential_ingredients, additional_ingredients, instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            userId, 
            title, 
            image || null, 
            difficulty || 'medium', 
            type || null, 
            description,
            essentialIngredientsJSON,
            additionalIngredientsJSON,
            instructions
        );
        
        res.status(201).json({
            message: 'Recipe added successfully',
            recipeId: result.lastInsertRowid
        });
    } catch (err) {
        console.error('Error creating user recipe:', err);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});

/**
 * @swagger
 * /user-recipes/{id}:
 *   get:
 *     summary: Get a specific user recipe
 *     description: Get details of a specific recipe created by the user
 *     tags: [User Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
app.get('/user-recipes/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const recipeId = req.params.id;
    
    try {
        const recipe = db.prepare(`
            SELECT id, title, image, difficulty, type, description, 
                   essential_ingredients, additional_ingredients, instructions, created_at
            FROM user_recipes 
            WHERE id = ? AND user_id = ?
        `).get(recipeId, userId);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Parse JSON strings back to arrays
        const formattedRecipe = {
            ...recipe,
            essential_ingredients: recipe.essential_ingredients ? JSON.parse(recipe.essential_ingredients) : [],
            additional_ingredients: recipe.additional_ingredients ? JSON.parse(recipe.additional_ingredients) : []
        };
        
        res.json(formattedRecipe);
    } catch (err) {
        console.error('Error fetching user recipe:', err);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

/**
 * @swagger
 * /user-recipes/{id}:
 *   put:
 *     summary: Update a user recipe
 *     description: Update a specific recipe created by the user
 *     tags: [User Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
app.put('/user-recipes/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const recipeId = req.params.id;
    const { title, image, difficulty, type, description, essential_ingredients, additional_ingredients, instructions } = req.body;
    
    try {
        // Check if recipe exists and belongs to user
        const existingRecipe = db.prepare(`
            SELECT id FROM user_recipes
            WHERE id = ? AND user_id = ?
        `).get(recipeId, userId);
        
        if (!existingRecipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Build dynamic update query
        let updates = [];
        let params = [];
        
        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        
        if (image !== undefined) {
            updates.push('image = ?');
            params.push(image);
        }
        
        if (difficulty !== undefined) {
            updates.push('difficulty = ?');
            params.push(difficulty);
        }
        
        if (type !== undefined) {
            updates.push('type = ?');
            params.push(type);
        }
        
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        
        if (essential_ingredients !== undefined) {
            updates.push('essential_ingredients = ?');
            params.push(JSON.stringify(essential_ingredients));
        }
        
        if (additional_ingredients !== undefined) {
            updates.push('additional_ingredients = ?');
            params.push(JSON.stringify(additional_ingredients));
        }
        
        if (instructions !== undefined) {
            updates.push('instructions = ?');
            params.push(instructions);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        // Add recipeId and userId to params
        params.push(recipeId);
        params.push(userId);
        
        const stmt = db.prepare(`
            UPDATE user_recipes
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `);
        
        const result = stmt.run(...params);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Recipe not found or no changes made' });
        }
        
        res.json({ message: 'Recipe updated successfully' });
    } catch (err) {
        console.error('Error updating user recipe:', err);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});

/**
 * @swagger
 * /user-recipes/{id}:
 *   delete:
 *     summary: Delete a user recipe
 *     description: Delete a specific recipe created by the user
 *     tags: [User Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
app.delete('/user-recipes/:id', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const recipeId = req.params.id;
    
    try {
        // Check if recipe exists and belongs to user
        const existingRecipe = db.prepare(`
            SELECT id FROM user_recipes
            WHERE id = ? AND user_id = ?
        `).get(recipeId, userId);
        
        if (!existingRecipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        const stmt = db.prepare(`
            DELETE FROM user_recipes
            WHERE id = ? AND user_id = ?
        `);
        
        const result = stmt.run(recipeId, userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        res.json({ message: 'Recipe deleted successfully' });
    } catch (err) {
        console.error('Error deleting user recipe:', err);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
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