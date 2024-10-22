const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors'); // Aggiunto CORS
const app = express();
const port = 3000;


app.use(cors());

// Middleware per interpretare il body in formato JSON
app.use(express.json());
// Connessione al database SQLite
let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connesso al database');
});

// Middleware per abilitare CORS


// Creazione della tabella "registrazione" (se non esiste)
db.run(`CREATE TABLE IF NOT EXISTS registrazione (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cognome TEXT,
    data TEXT,
    email TEXT,
    password TEXT,
    favourite_dish TEXT,
    username TEXT
)`);

// Endpoint POST per la registrazione di un nuovo utente
app.post('/registrazione', (req, res) => {
    const { nome, cognome, data, email, password, favourite_dish, username } = req.body;

    db.run(`INSERT INTO registrazione (nome, cognome, data, email, password, favourite_dish, username)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [nome, cognome, data, email, password, favourite_dish, username],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Nuovo utente creato', id: this.lastID });
        });
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
