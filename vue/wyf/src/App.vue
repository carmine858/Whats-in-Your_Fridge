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
        
        
        <v-btn @click="navigateTo('/chat')">
          <v-icon>mdi-chat</v-icon>
          Chef chat
        </v-btn>
        <v-btn @click="navigateTo('/profile')">
          <v-icon>mdi-account</v-icon>
          Profilo
        </v-btn>
        <!-- Pulsante Admin, visibile solo se l'utente è admin -->
        <v-btn v-if="isAdmin" @click="navigateTo('/admin')" color="red">
          <v-icon>mdi-shield-account</v-icon>
          Admin
        </v-btn>
      </v-bottom-navigation>
    </v-layout>

    <!-- Contenuto principale centrato -->
    <div class="content-container" :class="{ 'admin-page': isAdminPage }">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value: 0,
      isAdmin: false
    };
  },
  computed: {
    // Controlla se la pagina corrente è login o registrazione
    isAuthPage() {
      const authPages = ['/', '/register']; // Aggiungi qui le pagine di autenticazione
      return authPages.includes(this.$route.path); // Verifica se la route corrente è login o registrazione
    },
    // Controlla se la pagina corrente è nell'area admin
    isAdminPage() {
      return this.$route.path.startsWith('/admin');
    }
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route);
    },
    async checkAdminStatus() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.isAdmin = false;
          return;
        }
        
        const response = await fetch('http://localhost:3000/userinfo', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          this.isAdmin = false;
          return;
        }
        
        const userData = await response.json();
        this.isAdmin = userData.role === 'admin';
      } catch (error) {
        console.error('Errore nel controllo dello stato admin:', error);
        this.isAdmin = false;
      }
    }
  },
  mounted() {
    this.checkAdminStatus();
  },
  watch: {
    '$route'() {
      this.checkAdminStatus();
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
  /*flex-direction: column;
  /*justify-content: space-between; /* Navbar in basso e contenuto principale centrato */
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
  padding: 20px;
}

/* Stile specifico per l'area admin */
.admin-page {
  background-image: none !important;
  background-color: #f5f5f5 !important;
  padding: 0 !important;
}

.admin-page .background-div {
  background-image: none;
}
</style>