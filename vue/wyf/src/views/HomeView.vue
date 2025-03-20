<template>
  <v-container>
    <!-- Header -->
    <div class="header">
      <h2 class="greeting">Hello {{username}}</h2>
      <p class="subheader">What are you cooking today?</p>
    </div>

    <!-- Search and Filters -->
    <div class=".search-and-filters">
      <v-autocomplete
        class="custom-autocomplete"
        label="Search"
        :items="['pasta','pollo']"
        variant="underlined"
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

    <!-- Recipes -->
    <v-row class="recipe-grid" justify="start" align="start">
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="recipe-card" max-width="374">
          <!-- Usa direttamente l'URL dell'immagine -->
          <v-img :src="recipe.Image || defaultImage" height="150" cover></v-img>
          <v-card-text>
            <div class="recipe-header">
              <span class="recipe-title">{{ recipe.titolo }}</span>
              <v-chip class="rating-chip" color="orange" text>
                <v-icon small>mdi-star</v-icon> {{ recipe.rating }}
              </v-chip>
            </div>
            <div class="recipe-meta">
              <span>{{ recipe.tempo }} | Difficoltà: {{ recipe.difficolta }}</span>
              <p>{{ recipe.descrizione }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      recipes: [],
      search: "",
      selectedCategory: "All",
      categories: ["All", "Indian", "Italian", "Asian", "Chinese"],
      loading: false,
      defaultImage: "https://via.placeholder.com/150",
      username: "",
    };
  },
  methods: {
    fetchRecipes() {
      this.loading = true;
      // Prepara i parametri della query
      const params = {};
      if (this.selectedCategory !== "All") {
        params.tipo = this.selectedCategory;
      }
      if (this.search) {
        params.search = this.search;
      }

      // Recupera i dati dal backend
      axios
        .get("http://localhost:3000/recipes", { params })
        .then((response) => {
          this.recipes = response.data.recipes;
        })
        .catch((error) => {
          console.error("Errore durante il caricamento delle ricette:", error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    selectCategory(category) {
      this.selectedCategory = category;
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
  },
  mounted() {
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
  font-size: 24px;
  color: #f4a53e;
}
.subheader {
  font-size: 16px;
  color: #888;
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

/* Griglia delle ricette */
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
