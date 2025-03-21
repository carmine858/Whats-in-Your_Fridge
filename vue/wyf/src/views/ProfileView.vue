<template>
  <v-container class="profile-container">
    <v-card class="profile-card">
      <!-- Header con immagine di copertina -->
      <div class="profile-header">
        <v-img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJguz-Yat9Wr46Dnevi49thl1jlYCfsYXiUw&s" class="cover-image"></v-img>
        <v-avatar class="profile-avatar">
          <v-img :src="user.avatar || 'https://via.placeholder.com/100'"></v-img>
        </v-avatar>
      </div>

      <!-- Informazioni Profilo -->
      <v-card-text class="text-center">
        <h2 class="username">{{ user.nome }} {{ user.cognome }}</h2>
        <p class="email">{{ user.email }}</p>
      </v-card-text>

      <!-- Sezioni navigabili -->
      <v-list dense class="profile-menu">
        <v-list-item>
          <v-list-item-icon><v-icon color="grey">mdi-heart</v-icon></v-list-item-icon>
          <v-list-item-title>Ricette Preferite</v-list-item-title>
          <v-list-item-action><v-icon>mdi-chevron-right</v-icon></v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-icon><v-icon color="grey">mdi-book</v-icon></v-list-item-icon>
          <v-list-item-title>Le Mie Ricette</v-list-item-title>
          <v-list-item-action><v-icon>mdi-chevron-right</v-icon></v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-icon><v-icon color="grey">mdi-history</v-icon></v-list-item-icon>
          <v-list-item-title>Storico Visualizzazioni</v-list-item-title>
          <v-list-item-action><v-icon>mdi-chevron-right</v-icon></v-list-item-action>
        </v-list-item>
      </v-list>

      <!-- Pulsante Logout -->
      <v-card-actions class="logout-button">
        <v-btn color="red" block @click="logout">Logout</v-btn>
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
        avatar: ''
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
      this.user = {
        nome: data.nome,
        cognome: data.cognome,
        email: data.email,
        avatar: data.avatar || 'https://via.placeholder.com/100'
      };
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
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.profile-card {
  max-width: 600px;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.profile-header {
  position: relative;
  height: 180px;
  width: 100%;
}

.cover-image {
  width: 100%;
  height: 100%;
  
}

.profile-avatar {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  border: 3px solid white;
}

.text-center {
  text-align: center;
  margin-top: 40px;
}

.username {
  font-size: 20px;
  font-weight: bold;
}

.email {
  color: grey;
  font-size: 14px;
}

.profile-menu {
  margin-top: 20px;
}

.logout-button {
  margin-top: 20px;
  padding: 10px;
}
</style>
