<template>
  <div class="app-container">
    <transition name="fade" mode="out-in">
      <!-- PROFILE MODE -->
      <div class="profile-page" v-if="!editMode && selectedSection === null">
        <!-- Profile Header with Background and Avatar -->
        <div class="profile-header">
          <div class="cover-container">
            <v-img 
              src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?q=80&w=1000&auto=format&fit=crop"
              class="cover-image"
              gradient="to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)"
            ></v-img>
            <div class="header-overlay">
              <div class="profile-name">
                <h2>{{ user.nome }} {{ user.cognome }}</h2>
                <p class="email">{{ user.email }}</p>
              </div>
            </div>
          </div>
          
          <v-avatar class="profile-avatar">
            <v-img :src="user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'"></v-img>
          </v-avatar>
          
          <div class="profile-actions">
            <v-btn icon color="white" class="edit-button" @click="editMode = true" aria-label="Edit profile">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Profile Info Cards -->
        <div class="profile-stats-container">
          <div class="stats-card">
            <div class="stat">
              <div class="stat-value">{{ recipes.length }}</div>
              <div class="stat-label">Ricette</div>
            </div>
            <v-divider vertical></v-divider>
            <div class="stat">
              <div class="stat-value">82</div>
              <div class="stat-label">Preferiti</div>
            </div>
            <v-divider vertical></v-divider>
            <div class="stat">
              <div class="stat-value">12</div>
              <div class="stat-label">Salvati</div>
            </div>
          </div>
        </div>

        <!-- Profile Bio -->
        <div class="profile-bio">
          <h3 class="bio-title">Su di me</h3>
          <p class="bio-text">{{ user.bio || 'Nessuna bio disponibile. Modifica il tuo profilo per aggiungere una breve descrizione su di te!' }}</p>
        </div>

        <!-- Profile Menu Items -->
        <div class="menu-items">
          <div class="menu-item" @click="navigateTo('myrecipes')">
            <div class="menu-icon-container">
              <v-icon class="menu-icon">mdi-chef-hat</v-icon>
            </div>
            <div class="menu-content">
              <span>Le mie ricette</span>
              <v-badge 
                :content="recipes.length" 
                :value="recipes.length > 0" 
                color="primary" 
                offset-x="10" 
                offset-y="15"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-badge>
            </div>
          </div>

          <div class="menu-item" @click="navigateTo('favorites')">
            <div class="menu-icon-container">
              <v-icon class="menu-icon">mdi-heart</v-icon>
            </div>
            <div class="menu-content">
              <span>Ricette preferite</span>
              <v-icon>mdi-chevron-right</v-icon>
            </div>
          </div>

          <div class="menu-item" @click="navigateTo('history')">
            <div class="menu-icon-container">
              <v-icon class="menu-icon">mdi-history</v-icon>
            </div>
            <div class="menu-content">
              <span>Cronologia visualizzazioni</span>
              <v-icon>mdi-chevron-right</v-icon>
            </div>
          </div>
          
          <!-- Settings menu item -->
          <div class="menu-item" @click="navigateTo('settings')">
            <div class="menu-icon-container">
              <v-icon class="menu-icon">mdi-cog</v-icon>
            </div>
            <div class="menu-content">
              <span>Impostazioni</span>
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

      <!-- EDIT MODE -->
      <div class="edit-profile-page" v-else-if="editMode">
        <div class="edit-header">
          <v-btn icon @click="editMode = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2>Modifica profilo</h2>
          <v-btn icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </div>

        <div class="edit-avatar-container">
          <v-avatar size="100" class="edit-avatar">
            <v-img :src="user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'"></v-img>
          </v-avatar>
          <div class="avatar-options">
            <div class="option">Carica nuova foto</div>
            <div class="option">Elimina immagine</div>
          </div>
        </div>

        <div class="form-container">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="user.nome" type="text" class="form-control" />
          </div>

          <div class="form-group">
            <label>Cognome</label>
            <input v-model="user.cognome" type="text" class="form-control" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="user.email" type="email" class="form-control" />
          </div>

          <div class="form-group">
            <label>Bio</label>
            <textarea v-model="user.bio" class="form-control bio-input" rows="4"></textarea>
          </div>

          <div class="form-group">
            <label>Piatto preferito</label>
            <input v-model="user.favourite_dish" type="text" class="form-control" />
          </div>

          <div class="form-group">
            <label>Telefono <span class="not-editable">Non modificabile</span></label>
            <input type="text" class="form-control" disabled placeholder="+39 XXX XXX XXXX" />
          </div>

          <div class="notification-toggle">
            <span>Notifiche push</span>
            <v-switch v-model="notifications" color="primary" hide-details></v-switch>
          </div>

          <v-btn block color="primary" class="save-button" @click="saveChanges">
            Salva modifiche
          </v-btn>
        </div>
      </div>

      <!-- USER RECIPES SECTION -->
      <div v-else-if="selectedSection === 'myrecipes'" class="section-container">
        <div class="section-header">
          <v-btn icon @click="backToProfile">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2>Le mie ricette</h2>
        </div>
        
        <user-recipes></user-recipes>
      </div>

      <!-- FAVORITES SECTION -->
      <div v-else-if="selectedSection === 'favorites'" class="section-container">
        <div class="section-header">
          <v-btn icon @click="backToProfile">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2>Ricette preferite</h2>
        </div>
        
        <div class="coming-soon">
          <v-img src="https://cdn-icons-png.flaticon.com/512/1442/1442912.png" max-width="100" class="coming-soon-icon"></v-img>
          <h3>Funzionalità in arrivo!</h3>
          <p>Presto potrai visualizzare qui le tue ricette preferite</p>
        </div>
      </div>

      <!-- HISTORY SECTION -->
      <div v-else-if="selectedSection === 'history'" class="section-container">
        <div class="section-header">
          <v-btn icon @click="backToProfile">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2>Cronologia visualizzazioni</h2>
        </div>
        
        <div class="coming-soon">
          <v-img src="https://cdn-icons-png.flaticon.com/512/2961/2961948.png" max-width="100" class="coming-soon-icon"></v-img>
          <h3>Funzionalità in arrivo!</h3>
          <p>Presto potrai visualizzare qui la cronologia delle tue ricette visitate</p>
        </div>
      </div>

      <!-- SETTINGS SECTION -->
      <div v-else-if="selectedSection === 'settings'" class="section-container">
        <div class="section-header">
          <v-btn icon @click="backToProfile">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2>Impostazioni</h2>
        </div>
        
        <div class="settings-container">
          <div class="settings-group">
            <h3>Notifiche</h3>
            <div class="setting-item">
              <div class="setting-label">Notifiche push</div>
              <v-switch v-model="settings.pushNotifications" color="primary" hide-details></v-switch>
            </div>
            <div class="setting-item">
              <div class="setting-label">Email di aggiornamento</div>
              <v-switch v-model="settings.emailNotifications" color="primary" hide-details></v-switch>
            </div>
          </div>
          
          <div class="settings-group">
            <h3>Privacy</h3>
            <div class="setting-item">
              <div class="setting-label">Profilo pubblico</div>
              <v-switch v-model="settings.publicProfile" color="primary" hide-details></v-switch>
            </div>
          </div>
          
          <div class="settings-group">
            <h3>Account</h3>
            <div class="setting-item action-item" @click="editMode = true">
              <div class="setting-label">Modifica profilo</div>
              <v-icon>mdi-chevron-right</v-icon>
            </div>
            <div class="setting-item action-item">
              <div class="setting-label">Cambia password</div>
              <v-icon>mdi-chevron-right</v-icon>
            </div>
            <div class="setting-item action-item danger" @click="logout">
              <div class="setting-label">Logout</div>
              <v-icon>mdi-logout</v-icon>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import UserRecipes from '@/components/UserRecipes.vue';

export default {
  components: {
    UserRecipes
  },
  data() {
    return {
      user: {
        nome: '',
        cognome: '',
        email: '',
        avatar: '',
        favourite_dish: '',
        bio: ''
      },
      recipes: [],
      editMode: false,
      selectedSection: null,
      notifications: true,
      settings: {
        pushNotifications: true,
        emailNotifications: true,
        publicProfile: false
      }
    };
  },
  async mounted() {
    await this.fetchUserInfo();
    await this.fetchUserRecipes();
  },
  methods: {
    async fetchUserInfo() {
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
          avatar: data.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          favourite_dish: data.favourite_dish || '',
          bio: data.bio || ''
        };
      } catch (error) {
        console.error(error.message);
        this.$router.push('/login');
      }
    },
    async fetchUserRecipes() {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:3000/user-recipes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user recipes');
        
        const data = await response.json();
        this.recipes = data.recipes || [];
      } catch (error) {
        console.error('Error fetching user recipes:', error);
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/')
    },
    navigateTo(section) {
      this.selectedSection = section;
    },
    backToProfile() {
      this.selectedSection = null;
    },
    saveChanges() {
      // Here you would implement the logic to save profile changes to the server
      // For now, we'll just simulate it with a timeout
      setTimeout(() => {
        this.editMode = false;
        // Show a success notification here
      }, 800);
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
  height: 100%;
  min-height: 580px;
  background-color: #f8fafc;
  overflow-x: hidden;
  font-family: 'Roboto', sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

/* PROFILE PAGE STYLES */
.profile-header {
  position: relative;
  height: 250px;
  margin-bottom: 40px;
}

.cover-container {
  height: 220px;
  position: relative;
  overflow: hidden;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01); /* Slight scale to avoid white borders */
  transition: transform 0.5s ease;
}

.cover-image:hover {
  transform: scale(1.05);
}

.header-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 25px 20px;
  color: white;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%);
  backdrop-filter: blur(3px);
}

.profile-avatar {
  position: absolute;
  left: 20px;
  bottom: -40px;
  width: 100px;
  height: 100px;
  border: 5px solid white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 2;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.profile-avatar:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.profile-name {
  margin-left: 110px;
  text-align: left;
}

.profile-name h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  letter-spacing: 0.5px;
}

.profile-name .email {
  margin: 5px 0 0;
  font-size: 15px;
  opacity: 0.95;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.profile-actions {
  position: absolute;
  bottom: -40px;
  right: 20px;
  z-index: 2;
}

.edit-button {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
  box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
}

.edit-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4) !important;
}

.profile-stats-container {
  padding: 0 16px;
  margin-bottom: 28px;
}

.stats-card {
  background: linear-gradient(120deg, #ffffff 0%, #f9faff 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stat {
  text-align: center;
  flex: 1;
  position: relative;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(99, 102, 241, 0.1);
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-bio {
  padding: 0 16px;
  margin-bottom: 28px;
}

.bio-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #334155;
  display: flex;
  align-items: center;
}

.bio-title::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #6366F1, #4F46E5);
  border-radius: 4px;
  margin-right: 8px;
}

.bio-text {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  color: #475569;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  border-left: 3px solid #6366F1;
}

.menu-items {
  margin: 0 16px 25px;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.menu-item::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent);
  transition: width 0.3s ease;
  z-index: 1;
  pointer-events: none;
}

.menu-item:hover::after {
  width: 100%;
}

.menu-item:hover {
  transform: translateX(5px);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon-container {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  background-color: #f1f5f9;
  position: relative;
  z-index: 2;
}

.menu-item:hover .menu-icon-container {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.25);
}

.menu-item:hover .menu-icon {
  color: white !important;
}

.menu-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  position: relative;
  z-index: 2;
}

/* Stile per il pulsante di logout */
.logout-item {
  margin-top: 8px;
  border-top: 2px solid #f1f5f9;
}

.logout-icon {
  background-color: #fee2e2;
  color: #ef4444;
}

.logout-item:hover .logout-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* EDIT PROFILE STYLES */
.edit-profile-page {
  background-color: white;
  height: 100%;
  overflow: auto;
  border-radius: 20px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #f1f5f9;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.edit-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #334155;
}

.edit-avatar-container {
  display: flex;
  align-items: center;
  padding: 25px;
  background: linear-gradient(120deg, #f1f5f9 0%, #f8fafc 100%);
}

.edit-avatar {
  margin-right: 25px;
  border: 3px solid white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.avatar-options {
  display: flex;
  flex-direction: column;
}

.option {
  background-color: white;
  padding: 10px 16px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.option:hover {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: white;
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.25);
  transform: translateY(-2px);
}

.form-container {
  padding: 25px;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  background-color: #fff;
  transition: all 0.3s ease;
  color: #334155;
}

.form-control:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  outline: none;
}

.bio-input {
  resize: vertical;
  min-height: 120px;
}

.not-editable {
  font-size: 12px;
  color: #94a3b8;
  float: right;
  font-weight: normal;
}

/* TRANSITIONS */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .app-container {
    border-radius: 0;
    box-shadow: none;
    max-width: 100%;
    height: 100vh;
  }
  
  .profile-header {
    height: 220px;
    margin-bottom: 35px;
  }
  
  .cover-container {
    height: 180px;
    border-radius: 0;
  }
  
  .profile-avatar {
    width: 90px;
    height: 90px;
    bottom: -35px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  
  .profile-name {
    margin-left: 100px;
  }
  
  .profile-name h2 {
    font-size: 22px;
  }
  
  .profile-name .email {
    font-size: 13px;
  }
  
  .profile-actions {
    bottom: -35px;
  }
}
</style>