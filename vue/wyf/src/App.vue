<template>
  <div id="app" class="background-div">


    <!-- Mostra la navbar solo se non sei nelle pagine di login o registrazione -->
    <v-layout v-if="!isAuthPage" class="overflow-visible" style="height: 56px;">
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

        <v-btn @click="navigateTo('/profile')">
          <v-icon>mdi-account</v-icon>
          <span>Profilo</span>
        </v-btn>
      </v-bottom-navigation>
    </v-layout>

    <!-- router-view per mostrare le pagine -->
    <router-view />
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

.app-title {
  font-family: 'Pacifico', cursive; /* Font a tema */
  font-size: 3rem;
  color: white;
  text-align: center;
  margin-bottom: -80px;
  margin-top: 20px;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: orange;
}

.background-div {
background-image: url('@/assets/sfondo.jpg'); /* Usa il percorso dell'immagine */
background-size: cover; /* Copre interamente l'area */
background-position: center;
background-repeat: no-repeat;
width: 100%;
min-height: 100vh; /* Copre l'altezza della finestra */
display: flex;
justify-content: center;
align-items: center;
}
</style>



