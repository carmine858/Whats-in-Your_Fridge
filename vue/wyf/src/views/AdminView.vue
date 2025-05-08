<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :width="260"
      :mini-variant-width="56"
      app
      permanent
    >
      <v-list-item class="px-2">
        <v-list-item-avatar v-if="miniVariant">
          <v-icon>mdi-view-dashboard</v-icon>
        </v-list-item-avatar>
        <v-list-item-title v-if="!miniVariant" class="text-h6">
          Pannello Admin
        </v-list-item-title>
        
         
      </v-list-item>

      <v-divider></v-divider>

      <v-list nav dense>
        <v-list-item 
          v-for="item in menuItems" 
          :key="item.title"
          :to="item.to"
          link
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list dense>
          <v-list-item @click="logout" link>
            <v-list-item-icon>
              <v-icon color="red">mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'AdminView',
  data() {
    return {
      drawer: true,
      miniVariant: false,
      menuItems: [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/admin/dashboard' },
        { title: 'Utenti', icon: 'mdi-account-group', to: '/admin/users' }
      ]
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/');
    },
    toggleMini() {
      this.miniVariant = !this.miniVariant;
      // Salva la preferenza in localStorage
      localStorage.setItem('admin-sidebar-mini', this.miniVariant);
    },
    checkScreenSize() {
      // Su schermi piccoli, imposta automaticamente il pannello in modalità mini
      if (window.innerWidth < 960 && !this.miniVariant) {
        this.miniVariant = true;
      }
    }
  },
  mounted() {
    // Recupera l'impostazione salvata o imposta in base alla dimensione dello schermo
    const savedMini = localStorage.getItem('admin-sidebar-mini');
    if (savedMini !== null) {
      this.miniVariant = savedMini === 'true';
    } else {
      this.checkScreenSize();
    }
    
    // Aggiungi un listener per adattare quando la finestra viene ridimensionata
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeUnmount() { // Cambiato da beforeDestroy a beforeUnmount per Vue 3
    window.removeEventListener('resize', this.checkScreenSize);
  }
}
</script>

<style scoped>
/* Aggiungi stili personalizzati se necessario */
</style>