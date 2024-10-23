<template>
  <div id="app">
    <!-- Mostra la navbar solo se non sei nelle pagine di login o registrazione -->
    <v-layout v-if="!isAuthPage" class="overflow-visible" style="height: 56px;">
      <v-bottom-navigation
        v-model="value"
        color="orange"
        active
      >
        <v-btn @click="navigateTo('/home')">
          <v-icon>mdi-home</v-icon>
          Recents
        </v-btn>

        <v-btn @click="navigateTo('/about')">
          <v-icon>mdi-food</v-icon>
          Favorites
        </v-btn>

        <v-btn @click="navigateTo('/nearby')">
          <v-icon>mdi-account</v-icon>
          <span>Nearby</span>
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
</style>



