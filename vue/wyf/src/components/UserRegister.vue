<template>
  <v-row justify="center" align="center" class="login-row">
    <v-col cols="12" lg="6" md="8" sm="10">
      <v-card class="login-card">
        <v-card-title class="text-center">
          <h2 class="headline">Accedi</h2>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="username"
              :error-messages="errorMessages.username"
              :rules="[(v) => !!v || 'Username è obbligatorio']"
              label="Username"
              placeholder="Inserisci il tuo username"
              required
              prepend-icon="mdi-account"
            ></v-text-field>

            <v-text-field
              v-model="password"
              :error-messages="errorMessages.password"
              :rules="[(v) => !!v || 'Password è obbligatoria']"
              label="Password"
              type="password"
              placeholder="Inserisci la tua password"
              required
              prepend-icon="mdi-lock"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="d-flex justify-center">
          <v-btn color="primary" @click="submit" class="submit-btn">Accedi</v-btn>
          <v-btn text @click="resetForm" class="ml-2">Annulla</v-btn>
        </v-card-actions>

        <!-- Testo per l'account e il link di registrazione -->
        <v-card-actions class="d-flex justify-center">
          <p class="text-center">
            Non hai un account?
            <a href="#" @click="goToRegister" class="register-link">Registrati</a>
          </p>
        </v-card-actions>

        <!-- Alert di successo per il login -->
        <v-alert
          v-if="showSuccessAlert"
          type="success"
          dismissible
          class="mt-4"
        >
          Accesso avvenuto con successo! Benvenuto!
        </v-alert>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import axios from 'axios';

export default {
data() {
  return {
    valid: false,
    username: '',
    password: '',
    errorMessages: {
      username: '',
      password: ''
    },
    showSuccessAlert: false // Stato per gestire la visualizzazione dell'alert
  };
},
methods: {
  submit() {
    this.errorMessages = {
      username: '',
      password: ''
    };

    // Validazione dei campi
    if (!this.username) this.errorMessages.username = 'Username è obbligatorio';
    if (!this.password) this.errorMessages.password = 'Password è obbligatoria';

    // Se non ci sono errori, invia i dati al server
    if (Object.values(this.errorMessages).every((msg) => msg === '')) {
      const loginData = {
        username: this.username,
        password: this.password
      };

      // Esegui la chiamata API per il login
      axios.post('http://localhost:3000/login', loginData)
        .then(() => {
          // Mostra l'alert di successo
          this.showSuccessAlert = true;
          
          // Reindirizza alla home dopo un breve ritardo
          setTimeout(() => {
            this.$router.push('/home'); // Reindirizza all'home
          }, 2000); // Aspetta 2 secondi prima di reindirizzare
        })
        .catch(error => {
          console.error('Errore durante il login:', error);
          this.errorMessages.password = 'Credenziali non valide'; // Messaggio di errore generico
        });
    }
  },
  resetForm() {
    this.username = '';
    this.password = '';
    this.errorMessages = {
      username: '',
      password: ''
    };
    this.showSuccessAlert = false; // Resetta l'alert in caso di reset
  },
  // Metodo per reindirizzare alla pagina di registrazione
  goToRegister() {
    this.$router.push('/register'); // Reindirizza alla pagina di registrazione
  }
}
};
</script>

<style scoped>
.login-row {
min-height: 100vh; /* Allinea verticalmente il contenuto */
background-color: #f5f5f5; /* Colore di sfondo chiaro */
}

.login-card {
box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); /* Ombra per la carta */
border-radius: 10px; /* Angoli arrotondati */
padding: 20px; /* Padding interno */
}

.submit-btn {
transition: background-color 0.3s; /* Transizione dolce */
}

.submit-btn:hover {
background-color: #1976d2; /* Colore di sfondo al passaggio del mouse */
color: white; /* Colore del testo al passaggio del mouse */
}

.text-center {
text-align: center;
}

.register-link {
color: #1976d2;
cursor: pointer;
text-decoration: underline;
}

.register-link:hover {
color: #0d47a1; /* Cambia colore al passaggio del mouse */
}
</style>
