<template>
    <div>
      <h1 class="text-h4 mb-6">Gestione Utenti</h1>
      
      <v-card>
        <v-data-table
          :headers="headers"
          :items="users"
          :items-per-page="10"
          class="elevation-1"
          :loading="loading"
        >
          <!-- Usa questa sintassi per evitare errori eslint -->
          <template #[`item.role`]="{ item }">
            <v-chip
              :color="item.role === 'admin' ? 'red' : 'primary'"
              dark
            >
              {{ item.role || 'user' }}
            </v-chip>
          </template>
          
          <template #[`item.actions`]="{ item }">
            <v-btn
              v-if="item.role !== 'admin'"
              color="error"
              small
              icon
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <v-tooltip v-else bottom>
              <template #activator="{ props }">
                <v-btn
                  disabled
                  small
                  icon
                  v-bind="props"
                >
                  <v-icon>mdi-shield</v-icon>
                </v-btn>
              </template>
              <span>Utente admin protetto</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card>
      
      <!-- Dialog di conferma eliminazione -->
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">
            Conferma eliminazione
          </v-card-title>
          
          <v-card-text>
            Sei sicuro di voler eliminare l'utente "{{ userToDelete?.username }}"? 
            <br><br>
            Questa azione non può essere annullata.
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="dialog = false">
              Annulla
            </v-btn>
            <v-btn color="red darken-1" text @click="deleteUser">
              Elimina
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script>
  export default {
    name: 'UsersList',
    data() {
      return {
        loading: true,
        dialog: false,
        userToDelete: null,
        headers: [
          { text: 'ID', value: 'id' },
          { text: 'Nome', value: 'nome' },
          { text: 'Cognome', value: 'cognome' },
          { text: 'Username', value: 'username' },
          { text: 'Email', value: 'email' },
          { text: 'Ruolo', value: 'role' },
          { text: 'Azioni', value: 'actions', sortable: false }
        ],
        users: []
      }
    },
    async mounted() {
      await this.loadUsers();
    },
    methods: {
      async loadUsers() {
        try {
          this.loading = true;
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3000/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Errore nel caricamento degli utenti');
          }
          
          const data = await response.json();
          this.users = data.users;
        } catch (error) {
          console.error('Errore nel caricamento degli utenti:', error);
          if (this.$root.$emit) {
            this.$root.$emit('show-snackbar', {
              message: 'Si è verificato un errore nel caricamento degli utenti',
              color: 'error'
            });
          }
        } finally {
          this.loading = false;
        }
      },
      confirmDelete(user) {
        this.userToDelete = user;
        this.dialog = true;
      },
      async deleteUser() {
        try {
          this.loading = true;
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3000/admin/users/${this.userToDelete.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Errore nell\'eliminazione dell\'utente');
          }
          
          await this.loadUsers();
          if (this.$root.$emit) {
            this.$root.$emit('show-snackbar', {
              message: 'Utente eliminato con successo',
              color: 'success'
            });
          }
        } catch (error) {
          console.error('Errore nell\'eliminazione dell\'utente:', error);
          if (this.$root.$emit) {
            this.$root.$emit('show-snackbar', {
              message: 'Si è verificato un errore nell\'eliminazione dell\'utente',
              color: 'error'
            });
          }
        } finally {
          this.dialog = false;
          this.userToDelete = null;
          this.loading = false;
        }
      }
    }
  }
  </script>