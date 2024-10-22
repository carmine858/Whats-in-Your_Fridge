const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Per la crittografia delle password
const jwt = require('jsonwebtoken'); // Per la gestione dei token
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Connessione al database SQLite
let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connesso al database');
});

// Creazione della tabella "registrazione" (se non esiste)
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

// Endpoint POST per la registrazione di un nuovo utente
app.post('/registrazione', async (req, res) => {
    const { nome, cognome, data, email, password, favourite_dish, username } = req.body;

    try {
        // Crittografia della password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username)
                VALUES (?, ?, ?, ?, ?, ?, ?)`, [nome, cognome, data, email, hashedPassword, favourite_dish, username],
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

// Endpoint POST per il login di un utente
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

            // Confronto della password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Credenziali non valide' });
            }

            // Creazione del token
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

// Rotta protetta (esempio)
app.get('/home', authenticateToken, (req, res) => {
    res.json({ message: 'Benvenuto nel tuo profilo!', user: req.user });
});

// Endpoint GET per ottenere tutte le registrazioni
app.get('/registrazione', (req, res) => {
    db.all('SELECT * FROM registrazione', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ users: rows });
    });
});

// Endpoint PUT per aggiornare un utente tramite ID
app.put('/registrazione/:id', (req, res) => {
    const { id } = req.params;
    const { nome, cognome, data, email, password, favourite_dish, username } = req.body;

    db.run(`UPDATE registrazione SET nome = ?, cognome = ?, data = ?, email = ?, password = ?, favourite_dish = ?, username = ?
            WHERE id = ?`, [nome, cognome, data, email, password, favourite_dish, username, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Utente non trovato' });
            }
            res.json({ message: 'Utente aggiornato con successo' });
        }
    );
});

// Chiusura del database in caso di interruzione del processo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Chiusura database');
        process.exit(0);
    });
});

// Avvio del server Express
app.listen(port, () => {
    console.log(`Server API in esecuzione su http://localhost:${port}`);
});

