class DBMock {
    constructor() {
        // Inizializza il "database" come un array in memoria
        this.recipes = [
            {
                id: 1,
                Image: "https://media-assets.lacucinaitaliana.it/photos/6411f3da3d6fc4cae3c3892b/16:9/w_3300,h_1856,c_limit/photo-07201503701.jpg",
                titolo: "Pasta al pomodoro",
                difficolta: "facile",
                tipo: "Italian",
                descrizione: "Un classico piatto italiano semplice e gustoso.",
                ingredienti_essenziali: ["pasta", "pomodoro", "basilico", "sale", "olio"],
                ingredienti_aggiuntivi: ["parmigiano"],
                istruzioni: "Cuoci la pasta e condisci con la salsa di pomodoro e basilico.",
            },
            {
                id: 2,
                Image: "https://staticcookist.akamaized.net/wp-content/uploads/sites/21/2024/07/tiramisu-finale.jpeg",
                titolo: "Tiramisù",
                difficolta: "media",
                tipo: "Italian",
                descrizione: "Il dolce italiano per eccellenza.",
                ingredienti_essenziali: ["savoiardi", "mascarpone", "uova", "zucchero", "caffè"],
                ingredienti_aggiuntivi: ["cacao"],
                istruzioni: "Monta uova e zucchero, aggiungi mascarpone, e fai strati con savoiardi e caffè.",
            },
            {
                id: 3,
                Image: "https://images.immediate.co.uk/production/volatile/sites/30/2021/02/butter-chicken-ac2ff98.jpg?quality=90&resize=440,400",
                titolo: "Butter Chicken",
                difficolta: "media",
                tipo: "Indian",
                descrizione: "Un classico piatto indiano cremoso e speziato.",
                ingredienti_essenziali: ["pollo", "burro", "pomodori", "panna", "garam masala"],
                ingredienti_aggiuntivi: ["zenzero", "aglio", "coriandolo"],
                istruzioni: "Marina il pollo con spezie e yogurt, poi cuocilo in una salsa cremosa a base di pomodoro e burro."
            },
            {
                id: 4,
                Image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/01_Paella_Valenciana_original.jpg/800px-01_Paella_Valenciana_original.jpg",
                titolo: "Paella Valenciana",
                difficolta: "difficile",
                tipo: "Spanish",
                descrizione: "Famoso piatto spagnolo ricco di sapori e colori.",
                ingredienti_essenziali: ["riso", "zafferano", "pollo", "coniglio", "fagiolini", "peperone"],
                ingredienti_aggiuntivi: ["frutti di mare", "piselli", "limone"],
                istruzioni: "Soffriggi la carne, aggiungi il riso e le verdure, versa il brodo con zafferano e cuoci fino a che il riso è al dente."
            },
            {
                id: 5,
                Image: "https://www.giallozafferano.it/images/ricette/172/17262/foto_hd/hd650x433_wm.jpg",
                titolo: "Crêpes alla Nutella",
                difficolta: "facile",
                tipo: "French",
                descrizione: "Sottili frittelle francesi ripiene di cioccolato.",
                ingredienti_essenziali: ["farina", "uova", "latte", "burro", "nutella"],
                ingredienti_aggiuntivi: ["zucchero a velo", "frutta fresca", "panna montata"],
                istruzioni: "Prepara una pastella fluida con farina, uova e latte. Cuoci in padella creando sottili dischi e farcisci con Nutella."
            },
            {
                id: 6,
                Image: "https://www.giallozafferano.it/images/5-503/Guacamole_650x433_wm.jpg",
                titolo: "Guacamole",
                difficolta: "facile",
                tipo: "Mexican",
                descrizione: "Salsa cremosa di avocado perfetta per nachos e tacos.",
                ingredienti_essenziali: ["avocado", "lime", "cipolla", "pomodoro", "coriandolo"],
                ingredienti_aggiuntivi: ["peperoncino", "aglio", "sale"],
                istruzioni: "Schiaccia gli avocado maturi e mescola con lime, cipolla tritata, pomodori a cubetti e coriandolo fresco."
            },
            {
                id: 7,
                Image: "https://fusedbyfionauyema.com/wp-content/uploads/2021/02/FUSED-BY-FIONA-UYEMA-FUTO-MAKI-SUSHI.jpg",
                titolo: "Sushi Maki",
                difficolta: "difficile",
                tipo: "Japanese",
                descrizione: "Rotoli di riso e pesce avvolti in alga nori.",
                ingredienti_essenziali: ["riso per sushi", "aceto di riso", "alga nori", "salmone", "avocado"],
                ingredienti_aggiuntivi: ["wasabi", "zenzero marinato", "salsa di soia"],
                istruzioni: "Cuoci il riso e condiscilo con aceto. Stendi su un'alga nori, aggiungi il ripieno e arrotola con l'apposito tappetino di bambù."
            },
            {
                id: 8,
                Image: "https://www.ghiottogalfre.it/50-zoom_default/risotto-ai-funghi-porcini.jpg",
                titolo: "Risotto ai funghi porcini",
                difficolta: "media",
                tipo: "Italian",
                descrizione: "Cremoso risotto arricchito dal sapore intenso dei funghi porcini.",
                ingredienti_essenziali: ["riso carnaroli", "funghi porcini", "cipolla", "brodo vegetale", "vino bianco"],
                ingredienti_aggiuntivi: ["parmigiano", "burro", "prezzemolo"],
                istruzioni: "Soffriggi la cipolla, tosta il riso, sfuma con vino e aggiungi i funghi. Cuoci aggiungendo brodo caldo poco alla volta fino a cottura."
            },
            {
                id: 9,
                Image: "https://www.giallozafferano.it/images/0-25/Moussaka_650x433_wm.jpg",
                titolo: "Moussaka",
                difficolta: "difficile",
                tipo: "Greek",
                descrizione: "Gustosa teglia di melanzane, carne e besciamella tipica della cucina greca.",
                ingredienti_essenziali: ["melanzane", "carne macinata", "pomodori", "cipolla", "besciamella"],
                ingredienti_aggiuntivi: ["cannella", "noce moscata", "formaggio feta", "patate"],
                istruzioni: "Friggi le melanzane, prepara un ragù speziato, stratifica con besciamella e cuoci in forno fino a doratura."
            },
            {
                id: 10,
                Image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk7Frs0lLnkqNTjKNHjMNbBYnaIulZ2rW-mQ&s",
                titolo: "Ravioli al vapore (Dim Sum)",
                difficolta: "difficile",
                tipo: "Chinese",
                descrizione: "Delicati fagottini di pasta ripieni di carne e verdure.",
                ingredienti_essenziali: ["farina", "acqua", "maiale macinato", "cavolo cinese", "zenzero"],
                ingredienti_aggiuntivi: ["cipollotti", "salsa di soia", "olio di sesamo", "funghi shiitake"],
                istruzioni: "Prepara la pasta, farcisci con il ripieno di carne e verdure, sigilla i bordi e cuoci a vapore per 10 minuti."
            },
            {
                id: 11,
                Image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Phat_Thai_kung_Chang_Khien_street_stall.jpg/1200px-Phat_Thai_kung_Chang_Khien_street_stall.jpg",
                titolo: "Pad Thai",
                difficolta: "media",
                tipo: "Thai",
                descrizione: "Noodles di riso saltati con verdure, uova e arachidi, tipico street food thailandese.",
                ingredienti_essenziali: ["noodles di riso", "tofu", "uova", "germogli di soia", "salsa di pesce", "tamarindo"],
                ingredienti_aggiuntivi: ["arachidi tritate", "lime", "peperoncino", "cipollotti", "coriandolo"],
                istruzioni: "Ammolla i noodles, saltali in padella con uova, tofu e verdure, condisci con salsa agrodolce a base di tamarindo e guarnisci con arachidi e lime."
            },
            {
                id: 12,
                Image: "https://images.immediate.co.uk/production/volatile/sites/30/2012/01/coq-au-vin-3740fe3.jpg?resize=768,574",
                titolo: "Coq au Vin",
                difficolta: "difficile",
                tipo: "French",
                descrizione: "Classico stufato francese di pollo al vino rosso, ricco e saporito.",
                ingredienti_essenziali: ["pollo", "vino rosso", "pancetta", "funghi", "cipolle", "carote"],
                ingredienti_aggiuntivi: ["timo", "alloro", "aglio", "brodo di pollo", "cognac"],
                istruzioni: "Rosola la pancetta, dora il pollo, aggiungi le verdure e sfuma con vino rosso. Cuoci a fuoco lento finché il pollo è tenero e la salsa si è addensata."
            }
        ];
        this.nextId = this.recipes.length ? this.recipes[this.recipes.length - 1].id + 1 : 1; // Generatore ID
    }

    // Ottieni tutte le ricette
    getAllRecipes() {
        return this.recipes;
    }

    // Ottieni una ricetta per ID
    getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === id) || null;
    }

    // Filtra ricette in base agli ingredienti
    filterRecipesByIngredients(ingredientList) {
        if (!Array.isArray(ingredientList) || ingredientList.length === 0) {
            throw new Error("Devi fornire una lista di ingredienti valida.");
        }
        return this.recipes.filter(recipe =>
            ingredientList.every(ing =>
                recipe.ingredienti_essenziali.map(i => i.toLowerCase()).includes(ing.toLowerCase())
            )
        );
    }

    // Crea una nuova ricetta
    createRecipe({ titolo, difficolta, tipo, descrizione, ingredienti_essenziali, ingredienti_aggiuntivi, istruzioni }) {
        if (!titolo || !difficolta || !tipo || !descrizione || !Array.isArray(ingredienti_essenziali) || !istruzioni) {
            throw new Error('Tutti i campi sono obbligatori: titolo, difficolta, tipo, descrizione, ingredienti_essenziali, istruzioni.');
        }
        const newRecipe = {
            id: this.nextId++,
            titolo,
            difficolta,
            tipo,
            descrizione,
            ingredienti_essenziali,
            ingredienti_aggiuntivi: ingredienti_aggiuntivi || [],
            istruzioni,
        };
        this.recipes.push(newRecipe);
        return newRecipe;
    }

    // Aggiorna una ricetta esistente
    updateRecipe(id, updates) {
        const recipe = this.recipes.find(recipe => recipe.id === id);
        if (!recipe) {
            return null;
        }
        if (updates.titolo) recipe.titolo = updates.titolo;
        if (updates.difficolta) recipe.difficolta = updates.difficolta;
        if (updates.tipo) recipe.tipo = updates.tipo;
        if (updates.descrizione) recipe.descrizione = updates.descrizione;
        if (updates.ingredienti_essenziali) recipe.ingredienti_essenziali = updates.ingredienti_essenziali;
        if (updates.ingredienti_aggiuntivi) recipe.ingredienti_aggiuntivi = updates.ingredienti_aggiuntivi;
        if (updates.istruzioni) recipe.istruzioni = updates.istruzioni;
        return recipe;
    }

    // Elimina una ricetta
    deleteRecipe(id) {
        const recipeIndex = this.recipes.findIndex(recipe => recipe.id === id);
        if (recipeIndex === -1) {
            return false;
        }
        this.recipes.splice(recipeIndex, 1);
        return true;
    }
}

module.exports = DBMock;


