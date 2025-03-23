<template>
  <div class="app-container">
    <!-- Pagina principale del profilo -->
    <div class="profile-page" v-if="!editMode">
      <div class="profile-header">
        <v-img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJguz-Yat9Wr46Dnevi49thl1jlYCfsYXiUw&s" class="cover-image"></v-img>
        <div class="header-buttons">
          <v-btn icon color="white" class="edit-button" @click="editMode = true">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </div>
        <v-avatar class="profile-avatar">
          <v-img :src="user.avatar || 'https://via.placeholder.com/100'"></v-img>
        </v-avatar>
      </div>

      <div class="profile-info">
        <h2 class="username">{{ user.nome }} {{ user.cognome }}</h2>
        <p class="email">{{ user.email }}</p>
      </div>

      <div class="menu-items">
        <div class="menu-item" @click="navigateTo('favorites')">
          <div class="menu-icon-container">
            <v-icon class="menu-icon">mdi-heart</v-icon>
          </div>
          <div class="menu-content">
            <span>Selected Recipes</span>
            <v-icon>mdi-chevron-right</v-icon>
          </div>
        </div>

        <div class="menu-item" @click="navigateTo('myrecipes')">
          <div class="menu-icon-container">
            <v-icon class="menu-icon">mdi-book</v-icon>
          </div>
          <div class="menu-content">
            <span>My Recipes</span>
            <v-icon>mdi-chevron-right</v-icon>
          </div>
        </div>

        <div class="menu-item" @click="navigateTo('history')">
          <div class="menu-icon-container">
            <v-icon class="menu-icon">mdi-history</v-icon>
          </div>
          <div class="menu-content">
            <span>History Views</span>
            <v-icon>mdi-chevron-right</v-icon>
          </div>
        </div>
        
        <!-- Pulsante Logout -->
        <div class="menu-item logout-item" @click="logout">
          <div class="menu-icon-container logout-icon">
            <v-icon class="menu-icon">mdi-logout</v-icon>
          </div>
          <div class="menu-content">
            <span>Logout</span>
            <v-icon>mdi-chevron-right</v-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagina di modifica del profilo -->
    <div class="edit-profile-page" v-else>
      <div class="edit-header">
        <v-btn icon @click="editMode = false">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <h2>EDIT PROFILE</h2>
        <v-btn icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </div>

      <div class="edit-avatar-container">
        <v-avatar size="80" class="edit-avatar">
          <v-img :src="user.avatar || 'https://via.placeholder.com/100'"></v-img>
        </v-avatar>
        <div class="avatar-options">
          <div class="option">Upload new picture</div>
          <div class="option">Delete image</div>
        </div>
      </div>

      <div class="form-container">
        <div class="form-group">
          <label>Name</label>
          <input v-model="user.nome" type="text" class="form-control" />
        </div>

        <div class="form-group">
          <label>Surname</label>
          <input v-model="user.cognome" type="text" class="form-control" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="user.email" type="email" class="form-control" />
        </div>

        <div class="form-group">
          <label>Phone number <span class="not-editable">Not editable</span></label>
          <input type="text" class="form-control" disabled placeholder="+375 (29) 189 23 34" />
        </div>

        <div class="notification-toggle">
          <span>Push notifications</span>
          <v-switch v-model="notifications" color="primary" hide-details></v-switch>
        </div>

        <v-btn block color="primary" class="save-button" @click="saveChanges">
          Save changes
        </v-btn>
      </div>
    </div>
  </div>
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
      },
      editMode: false,
      notifications: true
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
    },
    navigateTo(page) {
      console.log('Navigating to:', page);
      // Implementare la navigazione alle diverse sezioni
    },
    saveChanges() {
      // Qui andrebbe implementata la logica per salvare le modifiche al profilo
      this.editMode = false;
    }
  }
};
</script>

<style scoped>
.app-container {
  position: relative;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
  height: 580px;
  background-color: #f5f6fa;
  overflow-x: hidden;
  font-family: 'Roboto', sans-serif;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

/* Stili per la pagina principale del profilo */
.profile-page {
  padding-bottom: 10px; /* Ridotto da 20px */
}

.profile-header {
  position: relative;
  height: 150px; /* Ridotto da 180px per rendere più compatto */
  overflow: hidden; /* Aggiunto per contenere l'immagine */
  width: 100%;
}

.cover-image {
  width: 100% !important;
  height: 100%;
  object-fit: cover;
}

.header-buttons {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  z-index: 2;
}

.profile-avatar {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 90px;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.profile-info {
  margin-top: 45px; /* Ridotto da 50px */
  text-align: center;
  padding: 0 20px 5px; /* Ridotto il padding bottom da 10px a 5px */
}

.username {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.email {
  margin: 6px 0 0; /* Ridotto il margine top da 8px a 6px */
  color: #777;
  font-size: 15px;
}

.menu-items {
  margin: 15px 16px; /* Ridotto il margin top da 25px a 15px */
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  max-height: fit-content; /* Aggiunto per rendere la card più compatta */
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px; /* Ridotto il padding verticale da 16px a 12px */
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background-color: #f9f9f9;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon-container {
  width: 38px; /* Ridotto da 42px */
  height: 38px; /* Ridotto da 42px */
  background-color: #f1f3f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.menu-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

/* Stile per il pulsante di logout */
.logout-item {
  margin-top: 2px; /* Ridotto da 5px */
  border-top: 2px solid #f0f0f0;
}

.logout-icon {
  background-color: #ffeeee;
  color: #ff5252;
}

/* Stili per la pagina di modifica */
.edit-profile-page {
  background-color: white;
  min-height: 100vh;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
}

.edit-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.edit-avatar-container {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-top: 10px;
}

.edit-avatar {
  margin-right: 20px;
  border: 2px solid #f0f0f0;
}

.avatar-options {
  display: flex;
  flex-direction: column;
}

.option {
  background-color: #f1f3f5;
  padding: 8px 15px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option:hover {
  background-color: #e5e8ec;
}

.form-container {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background-color: #fff;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #333344;
  outline: none;
}

.not-editable {
  font-size: 12px;
  color: #888;
  float: right;
  font-weight: normal;
}

.notification-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 25px 0;
}

.save-button {
  margin-top: 30px;
  background-color: #333344 !important;
  color: white;
  border-radius: 8px;
  padding: 16px !important;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(51, 51, 68, 0.2) !important;
}
</style>