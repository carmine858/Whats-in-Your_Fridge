class DBMock {
    constructor() {
        // Inizializza il "database" come un array in memoria
        this.recipes = [
            {
                id: 1,
                Image: "",
                titolo: "Pasta al pomodoro",
                difficolta: "facile",
                tipo: "primo",
                descrizione: "Un classico piatto italiano semplice e gustoso.",
                ingredienti_essenziali: ["pasta", "pomodoro", "basilico", "sale", "olio"],
                ingredienti_aggiuntivi: ["parmigiano"],
                istruzioni: "Cuoci la pasta e condisci con la salsa di pomodoro e basilico.",
            },
            {
                id: 2,
                Image: "/img/tiramisu.jpg",
                titolo: "Tiramisù",
                difficolta: "media",
                tipo: "dessert",
                descrizione: "Il dolce italiano per eccellenza.",
                ingredienti_essenziali: ["savoiardi", "mascarpone", "uova", "zucchero", "caffè"],
                ingredienti_aggiuntivi: ["cacao"],
                istruzioni: "Monta uova e zucchero, aggiungi mascarpone, e fai strati con savoiardi e caffè.",
            },
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
