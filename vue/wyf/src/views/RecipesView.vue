<template>
<template>
  <div class="search-container">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <h1 class="search-title">Search recipes</h1>
          <div class="search-bar">
            <!-- Barra di ricerca -->
            <v-text-field
              v-model="ingredients"
              label="Inserisci ingredienti separati da virgola"
              outlined
              hide-details
              dense
            ></v-text-field>
            <!-- Bottone di filtro -->
            <v-btn
              color="orange"
              class="filter-btn"
              @click="applyFilter"
            >
              Cerca
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Risultati -->
      <v-row>
        <v-col cols="12" md="4" v-for="recipe in filteredRecipes" :key="recipe.id">
          <v-card>
            <v-img :src="recipe.image" height="200px"></v-img>
            <v-card-title>{{ recipe.title }}</v-card-title>
            <v-card-subtitle>By {{ recipe.author }}</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

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
      async applyFilter() {
        if (!this.ingredients) {
            this.filteredRecipes = []; // Se non ci sono ingredienti, svuota i risultati
            return;
        }

        try {
            const response = await axios.get('http://localhost:3000/ricette/filtra', {
                params: { ingredienti: this.ingredients }
            });
            this.filteredRecipes = response.data.ricette; // Popola i risultati con quelli filtrati
        } catch (error) {
            console.error('Errore durante il filtraggio:', error.message);
            this.filteredRecipes = [];
        }
    }
  }
  };
  </script>
  
  <style scoped>
 .search-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
}

.search-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.filter-btn {
  height: 40px;
  align-self: center;
}

.v-card {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.v-card-title {
  font-size: 16px;
  font-weight: bold;
}

.v-card-subtitle {
  font-size: 14px;
  color: #666;
}
  </style>
  