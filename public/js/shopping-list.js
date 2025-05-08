// ...existing code...

// Funzione per aggiungere un ingrediente alla lista della spesa
function addToShoppingList(ingredient) {
    // Verifica se l'ingrediente è già nella lista
    const existingItem = shoppingList.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase());
    
    if (existingItem) {
        // Se esiste già, aggiorna la quantità
        existingItem.quantity = (parseFloat(existingItem.quantity) + parseFloat(ingredient.quantity || 1)).toString();
        existingItem.unit = ingredient.unit || existingItem.unit;
    } else {
        // Altrimenti, aggiungi il nuovo ingrediente
        shoppingList.push({
            id: Date.now().toString(),
            name: ingredient.name,
            quantity: ingredient.quantity || "1",
            unit: ingredient.unit || "",
            checked: false
        });
    }
    
    // Salva la lista aggiornata
    saveShoppingList();
    
    // Aggiorna l'interfaccia utente
    renderShoppingList();
}

// ...existing code...