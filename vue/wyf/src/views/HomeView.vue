<template>
  <v-container>
    <!-- Header -->
    <div class="header">
      <h2 class="greeting">Hello {{username}}</h2>
      <p class="subheader">What are you cooking today?</p>
    </div>

    <!-- Search and Filters -->
    <div class="search-and-filters">
      <v-autocomplete
        class="custom-autocomplete"
        label="Search"
        v-model="search"
        :items="searchSuggestions"
        :loading="loadingSuggestions"
        variant="underlined"
        @update:search="debouncedFetchSuggestions"
        @change="onSearchChange"
      ></v-autocomplete><br><br>

      <!-- Chip di categoria -->
      <div class="category-chips">
        <v-chip
          v-for="category in categories"
          :key="category"
          variant="elevated"
          color="primary"
          :class="{'selected-chip': selectedCategory === category}"
          @click="selectCategory(category)"
        >
          {{ category }}
        </v-chip>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="text-center my-5">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2">Caricamento ricette in corso...</p>
    </div>

    <!-- No results message -->
    <div v-else-if="recipes.length === 0" class="text-center my-5">
      <p>Nessuna ricetta trovata. Prova a modificare i criteri di ricerca.</p>
    </div>

    <!-- Recipes -->
    <v-row v-else class="recipe-grid" justify="start" align="start">
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="recipe-card" max-width="374">
          <!-- Gestione migliorata dell'immagine -->
          <div class="recipe-image-container">
            <img 
              v-if="recipe.Image" 
              :src="validateImageUrl(recipe.Image)" 
              class="recipe-image" 
              @error="handleImageError($event, recipe)"
              alt="Recipe image"
            />
            <div v-else class="default-image-container">
              <v-icon size="48" color="grey lighten-1">mdi-food</v-icon>
            </div>
          </div>
          
          <v-card-text>
            <div class="recipe-header">
              <span class="recipe-title">{{ recipe.titolo }}</span>
              <v-chip class="rating-chip" color="orange" text>
                <v-icon small>mdi-star</v-icon> {{ recipe.rating || "N/A" }}
              </v-chip>
            </div>
            <div class="recipe-meta">
              <span>{{ recipe.tempo || "N/A" }} | Difficoltà: {{ recipe.difficolta }}</span>
              <p>{{ recipe.descrizione }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/* eslint-disable */
import axios from "axios";
import { debounce } from 'lodash';

export default {
  data() {
    return {
      recipes: [],
      search: "",
      searchSuggestions: [],
      loadingSuggestions: false,
      selectedCategory: "All",
      categories: ["All", "Indian", "Italian", "Asian", "Chinese"],
      loading: false,
      defaultImage: "https://via.placeholder.com/150",
      fallbackImages: {
        "Italian": "/img/italian-food.jpg",
        "Indian": "/img/indian-food.jpg",
        "Asian": "/img/asian-food.jpg",
        "Chinese": "/img/chinese-food.jpg",
        "Other": "/img/default-food.jpg"
      },
      username: "Guest",
    };
  },
  created() {
    // Creiamo una versione debounced della funzione di ricerca
    this.debouncedFetchSuggestions = debounce(this.fetchSuggestions, 300);
  },
  methods: {
    // Gestione errori immagine
    handleImageError(event, recipe) {
      console.log("Image load error for recipe:", recipe.titolo);
      
      // Prima prova a usare l'immagine di fallback specifica per tipo di cucina
      if (recipe.tipo && this.fallbackImages[recipe.tipo]) {
        event.target.src = this.fallbackImages[recipe.tipo];
      } else {
        // Altrimenti usa l'immagine di fallback generica
        event.target.src = this.fallbackImages.Other || this.defaultImage;
      }
      
      // Aggiungi una classe per lo styling
      event.target.classList.add('fallback-image');
    },
    
    // Nuova funzione per validare e correggere URL immagini
    validateImageUrl(url) {
      if (!url) return this.defaultImage;
      
      // Se l'URL non inizia con http o https, aggiungi https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url.replace(/^\/\//, '');
      }
      
      // Prova a usare un servizio proxy per le immagini WebP
      // Nota: questo è un esempio e potrebbe richiedere la configurazione di un vero servizio
      if (url.toLowerCase().endsWith('.webp')) {
        console.log("WebP image detected:", url);
        // Opzione 1: usa un proxy come imgproxy, imaginary o thumbor se disponibile
        // url = `https://your-proxy-service.com/convert?url=${encodeURIComponent(url)}&format=jpeg`;
        
        // Opzione 2: utilizza un servizio pubblico (nota: per produzione è meglio avere un proprio servizio)
        // url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
      }
      
      return url;
    },
    
    fetchRecipes() {
      this.loading = true;
      this.recipes = []; // Reset recipes array
      
      // Prepara i parametri della query
      const params = {};
      if (this.selectedCategory !== "All") {
        params.tipo = this.selectedCategory;
      }

      // Se c'è un termine di ricerca, utilizziamo l'API esterna
      if (this.search && this.search.trim() !== "") {
        console.log("Searching for:", this.search);
        
        axios
          .get(`https://dummyjson.com/recipes/search?q=${encodeURIComponent(this.search)}`)
          .then((response) => {
            console.log("API response:", response.data);
            
            if (response.data && response.data.recipes && response.data.recipes.length > 0) {
              // Converte i risultati API nel formato della nostra app
              this.recipes = response.data.recipes.map(apiRecipe => {
                // Log per debugging
                if (apiRecipe.thumbnail) {
                  console.log("Recipe image format:", apiRecipe.thumbnail.split('.').pop());
                }
                
                return {
                  id: apiRecipe.id,
                  Image: apiRecipe.thumbnail || apiRecipe.image || null,
                  titolo: apiRecipe.name, 
                  difficolta: this.getDifficultyFromApiRecipe(apiRecipe),
                  tipo: this.getCategoryFromApiRecipe(apiRecipe),
                  descrizione: apiRecipe.description || "Nessuna descrizione disponibile",
                  rating: apiRecipe.rating || "N/A",
                  tempo: `${apiRecipe.prepTimeMinutes || 0} min`
                };
              });
              
              console.log("Transformed recipes:", this.recipes);
              
              // Filtra per categoria se necessario
              if (this.selectedCategory !== "All") {
                this.recipes = this.recipes.filter(recipe => recipe.tipo === this.selectedCategory);
                console.log("After category filter:", this.recipes);
              }
            } else {
              console.log("No recipes found in API response");
              this.recipes = [];
            }
          })
          .catch((error) => {
            console.error("Errore durante la ricerca delle ricette:", error);
            this.recipes = [];
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        // Altrimenti usa il database locale
        console.log("Using local database");
        
        axios
          .get("http://localhost:3000/recipes", { params })
          .then((response) => {
            console.log("Local DB response:", response.data);
            if (response.data && response.data.recipes) {
              this.recipes = response.data.recipes;
            } else {
              this.recipes = [];
            }
          })
          .catch((error) => {
            console.error("Errore durante il caricamento delle ricette:", error);
            this.recipes = [];
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
    fetchSuggestions(query) {
      if (!query || query.length < 2) {
        this.searchSuggestions = [];
        return;
      }
      
      this.loadingSuggestions = true;
      axios
        .get(`https://dummyjson.com/recipes/search?q=${encodeURIComponent(query)}&limit=5`)
        .then((response) => {
          if (response.data && response.data.recipes) {
            // Estrai solo i nomi delle ricette per i suggerimenti
            this.searchSuggestions = response.data.recipes.map(recipe => recipe.name);
          }
        })
        .catch((error) => {
          console.error("Errore durante il caricamento dei suggerimenti:", error);
        })
        .finally(() => {
          this.loadingSuggestions = false;
        });
    },
    onSearchChange() {
      console.log("Search changed to:", this.search);
      this.fetchRecipes();
    },
    selectCategory(category) {
      this.selectedCategory = category;
      console.log("Category selected:", category);
      this.fetchRecipes(); 
    },
    fetchUserInfo() {
      // Esempio: ottieni le informazioni dell'utente dal server
      axios
        .get("http://localhost:3000/userinfo", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((response) => {
          this.username = response.data.username || "Guest";
        })
        .catch((error) => {
          console.error("Errore durante il caricamento delle informazioni utente:", error);
          this.username = "Guest"; // Fallback in caso di errore
        });
    },
    getDifficultyFromApiRecipe(recipe) {
      const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
      
      if (totalTime < 30) return "facile";
      if (totalTime < 60) return "media";
      return "difficile";
    },
    getCategoryFromApiRecipe(recipe) {
      if (!recipe.tags || recipe.tags.length === 0) return "Other";
      
      // Mappa tra i tag delle API e le nostre categorie
      const categoryMap = {
        "italian": "Italian",
        "india": "Indian", 
        "asian": "Asian",
        "chinese": "Chinese"
      };
      
      // Cerca il primo tag che corrisponde a una nostra categoria
      for (const tag of recipe.tags) {
        const normalizedTag = tag.toLowerCase();
        for (const key in categoryMap) {
          if (normalizedTag.includes(key)) {
            return categoryMap[key];
          }
        }
      }
      
      return "Other";
    }
  },
  mounted() {
    console.log("Component mounted");
    this.fetchRecipes();
    this.fetchUserInfo(); 
  },
};
</script>

<style scoped>
/* Container principale */
.header {
  text-align: center;
  margin-bottom: 20px;
}
.greeting {
  font-size: 29px;
  color: #f4a53e;
}
.subheader {
  font-size: 26px;
  color: #ffffff;
  margin-bottom: 20px;
}

/* Barra di ricerca e chip di categoria */
.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Spaziatura tra barra di ricerca e chip */
  margin-bottom: 20px;
  align-items: center;
}
.search-bar {
  width: 100%;
  max-width: 600px;
}
.category-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.selected-chip {
  background-color: #f4a53e !important; /* Colore evidenziato */
  color: white !important;
}

/* Gestione immagini ricette */
.recipe-image-container {
  height: 150px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
}
.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.default-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
}
.fallback-image {
  object-fit: cover;
  opacity: 0.9;
}

/* Griglia delle ricette*/
.recipe-grid {
  margin-top: 20px;
}
  
.recipe-card {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recipe-title {
  font-size: 18px;
  font-weight: bold;
}
.rating-chip {
  font-size: 12px;
  display: flex;
  align-items: center;
}
.recipe-meta {
  font-size: 14px;
  color: #999;
}

.custom-autocomplete {
  color: white; /* Colore di sfondo */
  width: 100%;
  max-width: 1550px;
}
</style>