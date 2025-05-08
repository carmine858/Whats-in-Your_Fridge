<template>
  
  <v-row justify="center" align="center" class="registration-row">
    <v-col cols="12" lg="6" md="8" sm="10">
      <v-card class="registration-card">
        <v-card-title class="text-center">
          <h1 class="headline"> WHAT'S IN YOUR FRIDGE?</h1><br>
            <h3>Registrazione</h3>
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="name"
              :error-messages="errorMessages.name"
              :rules="[(v) => !!v || 'Nome è obbligatorio']"
              label="Nome"
              placeholder="Es. Mario"
              required
              prepend-icon="mdi-account"
            ></v-text-field>

            <v-text-field
              v-model="surname"
              :error-messages="errorMessages.surname"
              :rules="[(v) => !!v || 'Cognome è obbligatorio']"
              label="Cognome"
              placeholder="Es. Rossi"
              required
              prepend-icon="mdi-account"
            ></v-text-field>

            <v-text-field
              v-model="username"
              :error-messages="errorMessages.username"
              :rules="[(v) => !!v || 'Username è obbligatorio']"
              label="Username"
              placeholder="Es. mario123"
              required
              prepend-icon="mdi-account"
            ></v-text-field>

            <v-text-field
              v-model="email"
              :error-messages="errorMessages.email"
              :rules="[(v) => !!v || 'Email è obbligatoria', (v) => /.+@.+\..+/.test(v) || 'Email non valida']"
              label="Email"
              placeholder="esempio@email.com"
              required
              prepend-icon="mdi-email"
            ></v-text-field>

            <v-text-field
              v-model="birthYear"
              :error-messages="errorMessages.birthYear"
              :rules="[(v) => !!v || 'Anno di nascita è obbligatorio']"
              label="Anno di Nascita"
              placeholder="Es. 1990"
              required
              prepend-icon="mdi-calendar"
            ></v-text-field>

            <v-text-field
              v-model="favoriteDish"
              :error-messages="errorMessages.favoriteDish"
              :rules="[(v) => !!v || 'Piatto preferito è obbligatorio']"
              label="Piatto Preferito"
              placeholder="Es. Pizza"
              required
              prepend-icon="mdi-food"
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
          <v-btn color="orange" @click="submit" class="submit-btn">Registrati</v-btn>
          <v-btn text @click="resetForm" class="ml-2">Annulla</v-btn>
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
      name: '',
      surname: '',
      username: '', 
      email: '',
      birthYear: '',
      favoriteDish: '',
      password: '',
      errorMessages: {
        name: '',
        surname: '',
        username: '', 
        email: '',
        birthYear: '',
        favoriteDish: '',
        password: ''
      }
    };
  },
  methods: {
    submit() {
      this.errorMessages = {
        name: '',
        surname: '',
        username: '', 
        email: '',
        birthYear: '',
        favoriteDish: '',
        password: ''
      };


      if (!this.name) this.errorMessages.name = 'Nome è obbligatorio';
      if (!this.surname) this.errorMessages.surname = 'Cognome è obbligatorio';
      if (!this.username) this.errorMessages.username = 'Username è obbligatorio'; 
      if (!this.email) this.errorMessages.email = 'Email è obbligatoria';
      if (!this.birthYear) this.errorMessages.birthYear = 'Anno di nascita è obbligatorio';
      if (!this.favoriteDish) this.errorMessages.favoriteDish = 'Piatto preferito è obbligatorio';
      if (!this.password) this.errorMessages.password = 'Password è obbligatoria';

  
      if (Object.values(this.errorMessages).every((msg) => msg === '')) {
        const userData = {
          nome: this.name,
          cognome: this.surname,
          username: this.username, 
          email: this.email,
          data: this.birthYear,
          favourite_dish: this.favoriteDish,
          password: this.password
        };

        
        axios.post('http://localhost:3000/registrazione', userData)
          .then(() => {
            alert('Registrazione avvenuta con successo!');
            this.$router.push('/');
            this.resetForm();
          })
          .catch(error => {
            console.error('Errore durante la registrazione:', error);
          });
      }
    },
    resetForm() {
      this.name = '';
      this.surname = '';
      this.username = ''; 
      this.email = '';
      this.birthYear = '';
      this.favoriteDish = '';
      this.password = '';
      this.errorMessages = {
        name: '',
        surname: '',
        username: '',
        email: '',
        birthYear: '',
        favoriteDish: '',
        password: ''
      };
    }
  }
};
</script>

<style scoped>
.headline {
font-family: fantasy, cursive;
color: #f4a53e;
}

.registration-row {
  min-height: 100%; 
 
}

.registration-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); 
  border-radius: 10px;

  background-color: #ffffff;


   
    width: 100%; 
    
    max-height: 100vh;
}

.submit-btn {
  transition: background-color 0.3s; 
}

.submit-btn:hover {
  background-color: #f4a53e; 
  color: white;
}
</style>

