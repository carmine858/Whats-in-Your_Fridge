// api.js
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());


let dati = {
    "ricette": [
        {
            "titolo": "Pasta al pomodoro",
            "difficolta": "facile",
            "tipo": "primo",
            "descrizione": "Un classico piatto italiano semplice e gustoso.",
            "ingredienti_essenziali": ["pasta", "pomodoro", "basilico", "sale", "olio"],
            "ingredienti_aggiuntivi": ["parmigiano"],
            "istruzioni": "Cuoci la pasta e condisci con la salsa di pomodoro e basilico."
        },
        {
            "titolo": "Tiramisù",
            "difficolta": "media",
            "tipo": "dessert",
            "descrizione": "Il dolce italiano per eccellenza.",
            "ingredienti_essenziali": ["savoiardi", "mascarpone", "uova", "zucchero", "caffè"],
            "ingredienti_aggiuntivi": ["cacao"],
            "istruzioni": "Monta uova e zucchero, aggiungi mascarpone, e fai strati con savoiardi e caffè."
        },
        {
            "titolo": "Bruschette al pomodoro",
            "difficolta": "facile",
            "tipo": "antipasto",
            "descrizione": "Antipasto semplice e veloce a base di pane e pomodoro.",
            "ingredienti_essenziali": ["pane", "pomodoro", "basilico", "olio", "sale"],
            "ingredienti_aggiuntivi": ["aglio"],
            "istruzioni": "Tosta il pane, aggiungi i pomodori a cubetti e condisci con olio e basilico."
        }
        
    ]
};


function filter(array, predicate) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            result[result.length] = array[i];
        }
    }
    return result;
}


app.get('/ricette', function (req, res) {
    res.type('application/json');
    res.send(JSON.stringify(dati));
});


app.get('/ricette/facili', function (req, res) {
    res.type('application/json');
    res.send(JSON.stringify({ "ricette": filter(dati.ricette, x => x.difficolta === "facile") }));
});

app.use(express.static('public'));

app.listen(3000, '0.0.0.0', () => {
    console.log("Server in ascolto sulla porta 3000");
});

