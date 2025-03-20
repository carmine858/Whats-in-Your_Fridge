<template>
    <v-container>
      <v-card class="mx-auto pa-5" max-width="500">
        <v-card-title class="text-h5">Profilo Utente</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title><strong>Nome:</strong> {{ user.nome }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Cognome:</strong> {{ user.cognome }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Email:</strong> {{ user.email }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Username:</strong> {{ user.username }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Piatti preferiti:</strong> {{ user.favourite_dish || 'Nessuno' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" @click="logout">Logout</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </template>
  
  <script>
  export default {
    data() {
      return {
        user: {
          nome: '',
          cognome: '',
          email: '',
          username: '',
          favourite_dish: ''
        }
      };
    },
    async mounted() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/userinfo', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (!response.ok) throw new Error('Errore nel recupero dati utente');
        
        const data = await response.json();
        this.user = data;
      } catch (error) {
        console.error(error.message);
        this.$router.push('/login');
      }
    },
    methods: {
      logout() {
        localStorage.removeItem('token');
        this.$router.push('/login');
      }
    }
  };
  </script>
  
  <style scoped>
  .v-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  </style>
  