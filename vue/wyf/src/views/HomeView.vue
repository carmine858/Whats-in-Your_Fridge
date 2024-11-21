<template>
  <v-container class="text-center">
    <h1 class="app-title">WHAT'S IN YOUR FRIDGE?</h1>



    <v-row>
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="mx-auto my-6" max-width="374">
          <v-img :src="recipe.immagine" height="250" cover></v-img>

          <v-card-item>
            <v-card-title>{{ recipe.titolo }}</v-card-title>
            <v-card-subtitle>
              <span class="me-1">{{ recipe.tipo }}</span>
              <v-icon
                v-if="recipe.difficolta === 'facile'"
                color="green"
                icon="mdi-check-circle"
              ></v-icon>
              <v-icon
                v-else-if="recipe.difficolta === 'media'"
                color="orange"
                icon="mdi-alert-circle"
              ></v-icon>
              <v-icon
                v-else
                color="red"
                icon="mdi-alert-circle-outline"
              ></v-icon>
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>{{ recipe.descrizione }}</v-card-text>
          <v-card-actions>
            <v-btn color="deep-purple-lighten-2" text block>
              Scopri di più
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "HomeView",
  data() {
    return {
      recipes: [],
    };
  },
  mounted() {
    // Effettua una chiamata all'endpoint delle ricette
    axios
      .get("http://localhost:3000/recipes")
      .then((response) => {
        this.recipes = response.data.recipes;
      })
      .catch((error) => {
        console.error("Errore durante il caricamento delle ricette:", error);
      });
  },
};
</script>
<style scoped>
/* Stile per il titolo centrale */
.app-title {
  margin-bottom: 5px;
  font-family: fantasy, cursive;
  color: #f4a53e;

}

</style>
