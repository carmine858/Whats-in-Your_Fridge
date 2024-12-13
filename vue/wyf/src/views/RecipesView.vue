<template>
    <div class="recipes-container">
      <h1 class="title">Recipes</h1>
  
      <div class="search-and-filters">
        <v-autocomplete
          class="custom-autocomplete"
          label="Search ingredients"
          v-model="searchIngredients"
          :items="availableIngredients"
          multiple
          variant="underlined"
        ></v-autocomplete>
        <v-btn class="search-button" @click="fetchRecipes">Search Recipes</v-btn>
      </div>
  
      <div v-if="recipes.length" class="recipes-list">
        <h2 class="subtitle">Found Recipes</h2>
        <div class="recipes-grid">
          <v-card v-for="recipe in recipes" :key="recipe.id" class="recipe-card">
            <v-img :src="recipe.image" :alt="recipe.title" class="recipe-image"></v-img>
            <v-card-title class="recipe-title">{{ recipe.title }}</v-card-title>
          </v-card>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        searchIngredients: [], // Ingredienti selezionati dall'utente
        availableIngredients: ['apples', 'flour', 'sugar', 'eggs', 'milk'], // Lista di suggerimenti
        recipes: [], // Risultati delle ricette
      };
    },
    methods: {
      async fetchRecipes() {
        if (this.searchIngredients.length === 0) {
          alert('Please select at least one ingredient!');
          return;
        }
  
        try {
          const ingredients = this.searchIngredients.join(',');
          const response = await axios.get('http://localhost:3000/api/spoonacular/recipes', {
            params: { ingredients, number: 5 },
          });
          this.recipes = response.data;
        } catch (error) {
          console.error('Errore durante il caricamento delle ricette:', error.message);
          alert('Failed to load recipes. Please try again later.');
        }
      },
    },
  };
  </script>
  
  <style>
 .recipes-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh; /* Altezza piena dello schermo */
  padding: 20px;
  background-size: cover;
  background-position: center;
}

/* Titolo principale */
.title {
  font-size: 3em;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  margin-bottom: 20px;
  text-align: center;
}

/* Contenitore della ricerca */
.search-and-filters {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: 400px; /* Limita la larghezza */
  background-color: rgba(255, 255, 255, 0.8); /* Sfondo traslucido */
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Stile autocomplete */
.custom-autocomplete {
  width: 100%;
}

/* Pulsante di ricerca */
.search-button {
  background-color: #6200ea;
  color: white;
  font-weight: bold;
  text-transform: uppercase;
  padding: 10px 20px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  width: 100%;
  text-align: center;
}

.search-button:hover {
  background-color: #3700b3;
}

/* Griglia delle ricette */
.recipes-list {
  width: 100%;
  max-width: 1200px;
  margin-top: 30px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  justify-content: center;
  align-items: start;
}

.recipe-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease;
  background: white;
}

.recipe-card:hover {
  transform: translateY(-5px);
}

.recipe-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.recipe-title {
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  padding: 10px;
}
  </style>
  