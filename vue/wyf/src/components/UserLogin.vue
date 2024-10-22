<template>
  
    <!-- Titolo dell'applicazione -->
    <v-row justify="center">
      <h1 class="app-title">What's in your Fridge?</h1>
    </v-row>

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

            <v-card-actions class="d-flex justify-center">
            <p class="text-center">
              Non hai un account?
              <a href="#" @click="goToRegister" class="register-link">Registrati</a>
            </p>
          </v-card-actions>


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
        }
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
              // Gestisci la risposta, ad esempio, memorizza il token
              alert('Accesso avvenuto con successo!');
              this.$router.push('/home'); // Reindirizza all'home
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
      },
      goToRegister() {
        this.$router.push('/register');
    }
  }
  };
  </script>
  
  <style scoped>

.app-title {
  font-family: 'Pacifico', cursive; /* Font a tema */
  font-size: 3rem;
  color: white;
  text-align: center;
  margin-bottom: -80px;
  margin-top: 20px;
}
  .login-row {
    min-height: 100vh; /* Allinea verticalmente il contenuto */
  
    background-color: #ffa726; /* Colore di sfondo chiaro */
  }
  
  .login-card {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 20px;
  background-color: #c49451; /* Marrone chiaro */
  }
  
  .submit-btn {
    transition: background-color 0.3s; /* Transizione dolce */
  }
  
  .submit-btn:hover {
    background-color: #1976d2; /* Colore di sfondo al passaggio del mouse */
    color: white; /* Colore del testo al passaggio del mouse */
  }
  </style>
  