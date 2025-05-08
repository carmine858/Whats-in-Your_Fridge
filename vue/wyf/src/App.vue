<template>
  <v-app id="app" class="app-wrapper">
    <!-- Navbar mobile visibile solo quando non sei nelle pagine di login o registrazione -->
    <v-layout v-if="!isAuthPage" class="navbar-container">
      <v-bottom-navigation
        v-model="value"
        color="var(--primary)"
        grow
        elevation="3"
        class="custom-navbar"
      >
        <v-btn @click="navigateTo('/home')" class="navbar-btn">
          <span>Home</span>
          <v-icon>mdi-home</v-icon>
        </v-btn>
        
        <v-btn @click="navigateTo('/chat')" class="navbar-btn">
          <span>Chef</span>
          <v-icon>mdi-chef-hat</v-icon>
        </v-btn>

        <v-btn @click="navigateTo('/shopping-list')" class="navbar-btn">
          <span>Lista</span>
          <v-icon>mdi-cart</v-icon>
        </v-btn>
        
        <v-btn @click="navigateTo('/profile')" class="navbar-btn">
          <span>Profilo</span>
          <v-icon>mdi-account</v-icon>
        </v-btn>
        
        <v-btn v-if="isAdmin" @click="navigateTo('/admin')" class="navbar-btn admin-btn">
          <span>Admin</span>
          <v-icon>mdi-shield-account</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </v-layout>

    <!-- Desktop Header visibile solo su schermi grandi e quando non sei nelle pagine di login/register -->
    <header v-if="!isAuthPage && !isMobile" class="desktop-header">
      <div class="header-container">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Logo" class="app-logo" />
          <h1 class="app-title">What's in Your Fridge</h1>
        </div>
        
        <nav class="desktop-nav">
          <v-btn text @click="navigateTo('/home')" class="desktop-nav-btn" :class="{'active': isActive('/home')}">
            <v-icon left>mdi-home</v-icon> Home
          </v-btn>
          <v-btn text @click="navigateTo('/chat')" class="desktop-nav-btn" :class="{'active': isActive('/chat')}">
            <v-icon left>mdi-chef-hat</v-icon> Chef Chat
          </v-btn>
          <v-btn text @click="navigateTo('/shopping-list')" class="desktop-nav-btn" :class="{'active': isActive('/shopping-list')}">
            <v-icon left>mdi-cart</v-icon> Lista Spesa
          </v-btn>
          <v-btn text @click="navigateTo('/profile')" class="desktop-nav-btn" :class="{'active': isActive('/profile')}">
            <v-icon left>mdi-account</v-icon> Profilo
          </v-btn>
          <v-btn v-if="isAdmin" text @click="navigateTo('/admin')" class="desktop-nav-btn admin-nav-btn" :class="{'active': isActive('/admin')}">
            <v-icon left>mdi-shield-account</v-icon> Admin
          </v-btn>
        </nav>
      </div>
    </header>

    <!-- Contenuto principale -->
    <main class="content-container" :class="{ 'admin-page': isAdminPage, 'auth-page': isAuthPage }">
      <transition name="page-transition" mode="out-in">
        <router-view />
      </transition>
    </main>

    <!-- Footer con info e copyright -->
    <footer v-if="!isAuthPage && !isAdminPage" class="app-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <img src="@/assets/logo.png" alt="Logo" class="footer-app-logo" />
          <p>What's in Your Fridge</p>
        </div>
        
        <div class="footer-links">
          <div class="footer-links-group">
            <h4>Navigazione</h4>
            <a @click.prevent="navigateTo('/home')">Home</a>
            <a @click.prevent="navigateTo('/chat')">Chef Chat</a>
            <a @click.prevent="navigateTo('/shopping-list')">Lista Spesa</a>
            <a @click.prevent="navigateTo('/profile')">Profilo</a>
          </div>
          
          <div class="footer-links-group">
            <h4>Legale</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Termini di Servizio</a>
            <a href="#">Cookie Policy</a>
          </div>
          
          <div class="footer-links-group">
            <h4>Contatti</h4>
            <a href="mailto:info@whatsinyourfridge.com">Email</a>
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} What's in Your Fridge. Tutti i diritti riservati.</p>
        <p>Creato con <v-icon small color="red">mdi-heart</v-icon> in Italia</p>
      </div>
    </footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      value: 0,
      isAdmin: false,
      isMobile: false,
      windowWidth: window.innerWidth
    };
  },
  computed: {
    // Controlla se la pagina corrente è login o registrazione
    isAuthPage() {
      const authPages = ['/', '/register']; // Pagine di autenticazione
      return authPages.includes(this.$route.path);
    },
    // Controlla se la pagina corrente è nell'area admin
    isAdminPage() {
      return this.$route.path.startsWith('/admin');
    },
    // Anno corrente per copyright
    currentYear() {
      return new Date().getFullYear();
    }
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route);
    },
    isActive(route) {
      return this.$route.path === route;
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
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
      this.isMobile = window.innerWidth < 768;
    }
  },
  mounted() {
    this.checkAdminStatus();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    
    // Carica i font necessari via Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
    '$route'() {
      this.checkAdminStatus();
    }
  }
};
</script>

<style>
/* Importo il sistema di design */
@import '@/assets/theme.scss';

/* Reset e stile base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  background-color: var(--background);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Layout principale */
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('@/assets/sfondo.jpg'); 
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* Header desktop */
.desktop-header {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-medium);
  padding: 12px 24px;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
}

.app-logo {
  height: 40px;
  margin-right: 12px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform var(--transition-fast);
}

.app-logo:hover {
  transform: scale(1.05);
}

.app-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.desktop-nav {
  display: flex;
  gap: 12px;
}

.desktop-nav-btn {
  text-transform: none !important;
  font-weight: var(--font-weight-medium) !important;
  font-size: 0.95rem !important;
  padding: 0 20px !important;
  height: 44px !important;
  border-radius: var(--radius-round) !important;
  color: var(--text-secondary) !important;
  transition: all var(--transition-fast) !important;
  letter-spacing: 0.3px !important;
}

.desktop-nav-btn:hover {
  background-color: rgba(76, 175, 80, 0.1) !important;
  color: var(--primary) !important;
  transform: translateY(-2px);
}

.desktop-nav-btn.active {
  background-color: var(--primary) !important;
  color: white !important;
  box-shadow: var(--shadow-light) !important;
}

.admin-nav-btn {
  color: var(--error) !important;
}

.admin-nav-btn:hover {
  background-color: rgba(244, 67, 54, 0.1) !important;
  color: var(--error) !important;
}

.admin-nav-btn.active {
  background-color: var(--error) !important;
  color: white !important;
}

/* Navbar mobile */
.navbar-container {
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 1000;
}

.custom-navbar {
  border-top-left-radius: 20px !important;
  border-top-right-radius: 20px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05) !important;
}

.navbar-btn {
  min-width: 0 !important;
  height: 64px !important;
  font-weight: var(--font-weight-medium) !important;
  position: relative;
}

.navbar-btn .v-icon {
  margin-top: 4px;
  font-size: 22px !important;
  transition: all var(--transition-fast);
}

.navbar-btn span {
  font-size: 12px !important;
  margin-bottom: 2px;
  transition: all var(--transition-fast);
}

.navbar-btn:hover .v-icon,
.navbar-btn:active .v-icon,
.navbar-btn--active .v-icon {
  transform: translateY(-2px);
}

.admin-btn {
  background-color: rgba(244, 67, 54, 0.1) !important;
}

/* Contenuto principale */
.content-container {
  flex: 1;
  padding: 88px 16px 80px; /* Teniamo spazio per header e navbar */
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: linear-gradient(rgba(255, 255, 255, 0.93), rgba(255, 255, 255, 0.97));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-height: 100vh;
  max-width: 100%;
}

/* Stile specifico per l'area admin */
.admin-page {
  background-image: none !important;
  background-color: #f8f9fa !important;
  padding: 88px 0 0 !important;
  max-width: 100% !important;
}

/* Footer */
.app-footer {
  background-color: var(--text-primary);
  padding: 40px 24px 24px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 64px; /* Spazio per la navbar mobile */
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto 32px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-logo {
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.footer-logo p {
  margin: 12px 0 8px;
  font-size: 1.1rem;
  font-weight: var(--font-weight-medium);
  font-family: 'Playfair Display', serif;
}

.footer-app-logo {
  height: 48px;
  filter: brightness(0) invert(1);
}

.footer-links {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 48px;
  flex-wrap: wrap;
}

.footer-links-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.footer-links-group h4 {
  color: var(--secondary);
  margin-bottom: 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 1rem;
}

.footer-links-group a {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
  cursor: pointer;
}

.footer-links-group a:hover {
  color: white;
  transform: translateX(3px);
}

.footer-bottom {
  max-width: 1280px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Animazione per transizione pagine */
.page-transition-enter-active, 
.page-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Stile per scrollbar personalizzata */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(76, 175, 80, 0.5);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

/* Responsive */
@media (max-width: 768px) {
  .content-container {
    padding: 16px 16px 80px;
  }
  
  .footer-content {
    flex-direction: column;
  }
  
  .footer-links {
    justify-content: flex-start;
    gap: 32px;
  }
  
  .footer-bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (min-width: 768px) {
  .navbar-container {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding: 32px 16px 20px;
  }
  
  .footer-links {
    gap: 24px;
  }
  
  .footer-links-group {
    min-width: 140px;
  }
}
</style>