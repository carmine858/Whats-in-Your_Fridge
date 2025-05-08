<template>
    <div>
      <h1 class="text-h4 mb-6">Dashboard</h1>
      
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-col>
      </v-row>
      
      <template v-else>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4" color="primary" dark>
              <v-card-title>
                <v-icon large left>mdi-account-multiple</v-icon>
                Utenti Totali
              </v-card-title>
              <v-card-text class="text-h2 text-center">
                {{ dashboardData.totalUsers }}
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card class="mb-4" color="success" dark>
              <v-card-title>
                <v-icon large left>mdi-food</v-icon>
                Ricette Totali
              </v-card-title>
              <v-card-text class="text-h2 text-center">
                {{ dashboardData.totalRecipes }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <v-card>
          <v-card-title>
            <v-icon left>mdi-account-clock</v-icon>
            Utenti Recenti
          </v-card-title>
          
          <v-data-table
            :headers="headers"
            :items="dashboardData.recentUsers"
            :items-per-page="5"
            class="elevation-1"
          ></v-data-table>
        </v-card>
      </template>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminDashboard',
    data() {
      return {
        loading: true,
        headers: [
          { text: 'ID', value: 'id' },
          { text: 'Username', value: 'username' },
          { text: 'Email', value: 'email' },
          { text: 'Data Registrazione', value: 'data' }
        ],
        dashboardData: {
          totalUsers: 0,
          totalRecipes: 0,
          recentUsers: []
        }
      }
    },
    async mounted() {
      await this.loadDashboardData();
    },
    methods: {
      async loadDashboardData() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3000/admin/dashboard', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Errore nel caricamento dei dati');
          }
          
          this.dashboardData = await response.json();
        } catch (error) {
          console.error('Errore nel caricamento della dashboard:', error);
          // Usa Vuetify snackbar per notifiche
          this.$root.$emit('show-snackbar', {
            message: 'Si è verificato un errore nel caricamento dei dati',
            color: 'error'
          });
        } finally {
          this.loading = false;
        }
      }
    }
  }
  </script>