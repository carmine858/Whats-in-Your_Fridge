<template>
  <div class="register-form">
    <h2>Registrazione Utente</h2>
    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="email">Email:</label>
        <input v-model="form.email" type="email" id="email" required />
      </div>

      <div class="form-group">
        <label for="username">Username:</label>
        <input v-model="form.username" type="text" id="username" required />
      </div>

      <div class="form-group">
        <label for="firstName">Nome:</label>
        <input v-model="form.firstName" type="text" id="firstName" required />
      </div>

      <div class="form-group">
        <label for="lastName">Cognome:</label>
        <input v-model="form.lastName" type="text" id="lastName" required />
      </div>

      <div class="form-group">
        <label for="birthYear">Anno di nascita:</label>
        <input v-model="form.birthYear" type="text" id="birthYear" required />
      </div>

      <div class="form-group">
        <label for="favoriteDish">Piatto preferito:</label>
        <input v-model="form.favoriteDish" type="text" id="favoriteDish" required />
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input v-model="form.password" type="password" id="password" required />
      </div>

      <button type="submit">Registrati</button>
    </form>

    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserRegister',
  data() {
    return {
      form: {
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        birthYear: '',
        favoriteDish: '',
        password: ''
      },
      successMessage: '',
      errorMessage: ''
    };
  },
  methods: {
    async submitForm() {
      try {
        // Prepara i dati per la richiesta
        const userData = {
          nome: this.form.firstName,
          cognome: this.form.lastName,
          data: this.form.birthYear,
          email: this.form.email,
          password: this.form.password,
          favourite_dish: this.form.favoriteDish,
          username: this.form.username
        };

        // Invia i dati al backend tramite POST
        const response = await axios.post('http://localhost:3000/registrazione', userData);

        // Mostra messaggio di successo se la richiesta va a buon fine
        this.successMessage = response.data.message;
        this.errorMessage = '';
        
        // Resetta il form
        this.form = {
          email: '',
          username: '',
          firstName: '',
          lastName: '',
          birthYear: '',
          favoriteDish: '',
          password: ''
        };
      } catch (error) {
        // Mostra l'errore se c'è stato un problema
        this.errorMessage = error.response?.data?.error || 'Errore durante la registrazione';
        this.successMessage = '';
      }
    }
  }
};
</script>

<style scoped>
.register-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.success-message {
  color: green;
  margin-top: 15px;
}

.error-message {
  color: red;
  margin-top: 15px;
}
</style>

