const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const csv = require('csv-parser');
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

// Creazione tabella ricette
db.run(`CREATE TABLE IF NOT EXISTS ricette (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT,
    immagine TEXT,
    difficolta TEXT,
    tipo TEXT,
    descrizione TEXT,
    ingredienti TEXT,
    istruzioni TEXT,
    tempo TEXT,
    rating REAL
)`);

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

// Endpoint protetto di esempio
app.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Benvenuto nel tuo profilo!', user: req.user });
});

// Endpoint per ottenere tutte le ricette
app.get('/recipes', (req, res) => {
    const { tipo, search } = req.query;
    let query = 'SELECT * FROM ricette';
    const params = [];

    if (tipo || search) {
        query += ' WHERE ';
        if (tipo) {
            query += 'tipo = ? ';
            params.push(tipo);
        }
        if (search) {
            if (tipo) query += 'AND ';
            query += 'LOWER(titolo) LIKE ? ';
            params.push(`%${search.toLowerCase()}%`);
        }
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ recipes: rows });
    });
});

// Funzione per importare ricette da un file CSV
function importRicetteFromCSV(filePath) {
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const { Titolo, Immagine, Difficoltà, Tipo, Breve_descrizione, Ingredienti, Istruzioni, Tempo, Rating } = row;

            db.run(
                `INSERT INTO ricette (titolo, immagine, difficolta, tipo, descrizione, ingredienti, istruzioni, tempo, rating)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [Titolo, Immagine, Difficoltà, Tipo, Breve_descrizione, Ingredienti, Istruzioni, Tempo, parseFloat(Rating)],
                (err) => {
                    if (err) {
                        console.error("Errore durante l'inserimento nel database:", err.message);
                    }
                }
            );
        })
        .on('end', () => {
            console.log('Importazione completata.');
        });
}

// Importa dati di esempio da un file CSV
importRicetteFromCSV('./ricette.csv');

// Endpoint per ottenere una singola ricetta
app.get('/recipes/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM ricette WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Ricetta non trovata' });
        }
        res.json(row);
    });
});

// Endpoint per aggiornare una ricetta
app.put('/recipes/:id', (req, res) => {
    const { id } = req.params;
    const { titolo, immagine, difficolta, tipo, descrizione, ingredienti, istruzioni, tempo, rating } = req.body;

    db.run(
        `UPDATE ricette SET titolo = ?, immagine = ?, difficolta = ?, tipo = ?, descrizione = ?, ingredienti = ?, istruzioni = ?, tempo = ?, rating = ?
         WHERE id = ?`,
        [titolo, immagine, difficolta, tipo, descrizione, ingredienti, istruzioni, tempo, rating, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Ricetta non trovata' });
            }
            res.json({ message: 'Ricetta aggiornata con successo' });
        }
    );
});

// Chiusura del database al termine del processo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database chiuso');
        process.exit(0);
    });
});

// Avvio del server
app.listen(port, () => {
    console.log(`Server API in esecuzione su http://localhost:${port}`);
});