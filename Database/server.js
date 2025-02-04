const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '132257619357-ilvrflcd0vno5o18tq4n16kkpgitq523.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const DBMock = require('./DBMock');  // Importiamo il DBMock per le ricette

const app = express();
const port = 3000;
const axios = require('axios');

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
)`);

// Creazione tabella ricette nel mock
const mockDb = new DBMock();

// Endpoint per registrazione utenti
app.post('/registrazione', async (req, res) => {
    const { nome, cognome, data, email, password, favourite_dish, username } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, cognome, data, email, hashedPassword, favourite_dish, username],
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

// Endpoint per login utenti
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

            const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
            res.json({ message: 'Login avvenuto con successo', token });
        });
    } catch (error) {
        res.status(500).json({ error: 'Errore durante il login' });
    }
});

// Middleware per proteggere le rotte con JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Endpoint per ottenere tutte le ricette (dal mock DB)
app.get('/recipes', (req, res) => {
    const { tipo, search } = req.query;
    let recipes = mockDb.getAllRecipes(); // Metodo che restituisce tutte le ricette dal mock (modificare a seconda della struttura del mock)

    // Se sono presenti parametri di ricerca, filtriamo
    if (tipo || search) {
        recipes = recipes.filter(recipe => {
            if (tipo && recipe.tipo !== tipo) return false;
            if (search && !recipe.titolo.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }

    res.json({ recipes: recipes });
});

// Endpoint per ottenere una singola ricetta (dal mock DB)
app.get('/recipes/:id', (req, res) => {
    const { id } = req.params;

    const recipe = mockDb.getUserById(id); // Metodo che restituisce una ricetta per ID dal mock
    if (!recipe) {
        return res.status(404).json({ message: 'Ricetta non trovata' });
    }

    res.json(recipe);
});

// Endpoint per aggiungere una nuova ricetta (al mock DB)
app.post('/recipes', (req, res) => {
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

app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body;
  
    try {
        // Verifica il token ID con Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: CLIENT_ID, // Deve corrispondere al CLIENT_ID della tua app Google
        });
  
        const payload = ticket.getPayload();
        const email = payload.email;
        const nome = payload.given_name || ''; // Nome dell'utente
        const cognome = payload.family_name || ''; // Cognome dell'utente
        const username = email.split('@')[0]; // Usa l'email per generare un username univoco
        const favourite_dish = ''; // Puoi lasciare vuoto o gestire questo campo diversamente
        const data = new Date().toISOString().split('T')[0]; // Data di registrazione

        console.log('Utente verificato:', payload);

        // Controlla se l'utente esiste già
        db.get(`SELECT * FROM registrazione WHERE email = ?`, [email], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Errore nel database' });
            }

            if (!user) {
                // Se l'utente non esiste, crealo
                db.run(
                    `INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [nome, cognome, data, email, null, favourite_dish, username],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: 'Errore nel salvataggio dell\'utente' });
                        }
                        res.json({ 
                            message: 'Registrazione con Google completata',
                            user: { id: this.lastID, nome, cognome, email, username, favourite_dish }
                        });
                    }
                );
            } else {
                // L'utente esiste già, ritorna le sue informazioni
                res.json({ 
                    message: 'Login con Google riuscito', 
                    user 
                });
            }
        });
    } catch (error) {
        console.error('Errore nella verifica del token ID:', error);
        res.status(401).json({ message: 'Token ID non valido' });
    }
});

app.get('/userinfo', authenticateToken, (req, res) => {
    const userId = req.user.userId; // `userId` dovrebbe essere salvato nel token JWT durante il login

    db.get(`SELECT username FROM registrazione WHERE id = ?`, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Errore nel recupero delle informazioni utente' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        res.json({ username: row.username });
    });
});


// Avvio del server
app.listen(port, () => {
    console.log(`Server API in esecuzione su http://localhost:${port}`);
});
