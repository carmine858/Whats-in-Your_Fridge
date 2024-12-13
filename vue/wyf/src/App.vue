<template>
  <div id="app" class="background-div">
    <!-- Navbar visibile solo quando non sei nelle pagine di login o registrazione -->
    <v-layout v-if="!isAuthPage" class="navbar-container">
      <v-bottom-navigation
        v-model="value"
        color="orange"
        active
      >
        <v-btn @click="navigateTo('/home')">
          <v-icon>mdi-home</v-icon>
          Home
        </v-btn>
        <v-btn @click="navigateTo('/recipe')">
          <v-icon>mdi-food</v-icon>
          Ricette
        </v-btn>
        <v-btn @click="navigateTo('#')">
          <v-icon>mdi-magnify</v-icon>
          Cerca
        </v-btn>
        <v-btn @click="navigateTo('#')">
          <v-icon>mdi-cart</v-icon>
          Lista
        </v-btn>
        <v-btn @click="navigateTo('/profile')">
          <v-icon>mdi-account</v-icon>
          Profilo
        </v-btn>
      </v-bottom-navigation>
    </v-layout>

    <!-- Contenuto principale centrato -->
    <div class="content-container">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: 0
    };
  },
  computed: {
    // Controlla se la pagina corrente è login o registrazione
    isAuthPage() {
      const authPages = ['/', '/register']; // Aggiungi qui le pagine di autenticazione
      return authPages.includes(this.$route.path); // Verifica se la route corrente è login o registrazione
    }
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route);
    }
  }
};
</script>

<style>
/* Stile globale per il layout */
.background-div {
  background-image: url('@/assets/sfondo.jpg'); /* Immagine di sfondo */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  min-height: 100vh; /* Altezza intera finestra */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Navbar in basso e contenuto principale centrato */
}

/* Navbar */
.navbar-container {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 10;
}

/* Contenuto principale */
.content-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>
