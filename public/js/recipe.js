// ...existing code...

// Funzione per aggiungere gli ingredienti della ricetta alla lista della spesa
function addRecipeIngredientsToShoppingList(recipeId) {
    // Trova la ricetta selezionata
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        console.error('Ricetta non trovata');
        return;
    }
    
    // Ottieni gli ingredienti della ricetta
    const ingredients = recipe.ingredients;
    
    // Aggiungi ogni ingrediente alla lista della spesa
    ingredients.forEach(ingredient => {
        addToShoppingList(ingredient);
    });
    
    // Mostra un messaggio di conferma
    showNotification('Ingredienti aggiunti alla lista della spesa!');
}

// Funzione per mostrare una notifica
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Rimuovi la notifica dopo 3 secondi
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ...existing code...