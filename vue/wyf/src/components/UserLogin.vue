<template>
  <v-row justify="center" align="center" class="login-row">
    <v-col cols="12" lg="6" md="8" sm="10">
      <v-card class="login-card">
        <v-card-title class="text-center">
          <h1 class="headline">WHAT'S IN YOUR FRIDGE?</h1>
          <br />
          <h3>Login</h3>
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
        <v-card-actions class="d-flex justify-center">
          <v-btn color="orange" @click="submit" class="submit-btn">Accedi</v-btn>
          <v-btn text @click="resetForm" class="ml-2">Annulla</v-btn>
        </v-card-actions>

        <v-divider></v-divider>

        <!-- Pulsante Google -->
        <v-card-actions class="d-flex justify-center">
          <p class="text-center">
            Non hai un account?
            <a href="#" @click="goToRegister" class="register-link">Registrati</a>
          </p>
          <br /><br />
          <div id="google-button"></div>
          <br />
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
/* global google */
import axios from "axios";

export default {
  data() {
    return {
      valid: false,
      username: "",
      password: "",
      errorMessages: {
        username: "",
        password: "",
      },
      showAlert: false,
      alertMessage: "",
      alertType: "success",
    };
  },
  methods: {
    async submit() {
      this.errorMessages = {
        username: "",
        password: "",
      };

      if (!this.username) this.errorMessages.username = "Username è obbligatorio";
      if (!this.password) this.errorMessages.password = "Password è obbligatoria";

      if (Object.values(this.errorMessages).every((msg) => msg === "")) {
        try {
          const loginData = {
            username: this.username,
            password: this.password,
          };

          const response = await axios.post("http://localhost:3000/login", loginData);

          const { token, email, username } = response.data;

          localStorage.setItem("token", token);
          localStorage.setItem("email", email);
          localStorage.setItem("username", username);
          localStorage.setItem("loggedIn", "true");

          this.$router.push("/home");
        } catch (error) {
          console.error("Errore durante il login:", error);
          this.errorMessages.password = "Credenziali non valide";
        }
      }
    },
    resetForm() {
      this.username = "";
      this.password = "";
      this.errorMessages = {
        username: "",
        password: "",
      };
    },
    goToRegister() {
      this.$router.push("/register");
    },
    handleCredentialResponse(response) {
      console.log("Token ID di Google:", response.credential);

      axios
        .post("http://localhost:3000/auth/google", {
          idToken: response.credential,
        })
        .then(({ data }) => {
          this.alertMessage = "Accesso con Google riuscito!";
          this.alertType = "success";
          this.showAlert = true;

          // Salva il token e le informazioni di autenticazione
          localStorage.setItem("token", data.token);
          localStorage.setItem("googleAuth", "true");

          setTimeout(() => {
            this.$router.push("/home");
          }, 1500);
        })
        .catch((error) => {
          console.error("Errore durante il login con Google:", error);
          this.alertMessage = "Errore durante il login con Google";
          this.alertType = "error";
          this.showAlert = true;
        });
    },
  },
  mounted() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: "132257619357-ilvrflcd0vno5o18tq4n16kkpgitq523.apps.googleusercontent.com",
        callback: this.handleCredentialResponse,
      });
      google.accounts.id.renderButton(document.getElementById("google-button"), {
        theme: "outline",
        size: "large",
      });
    };
    document.head.appendChild(script);
  },
};
</script>

<style scoped>
#google-button {
  margin: 20px 0;
}

.headline {
  font-family: fantasy, cursive;
  color: #f4a53e;
}

.login-row {
  min-height: 100vh;
}

.login-card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 20px;
  background-color: #ffffff;
}

.submit-btn {
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #e5c499;
  color: #ffffff;
}
</style>
