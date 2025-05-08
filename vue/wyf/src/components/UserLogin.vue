<template>
  <div class="login-container">
    <div class="login-card-wrapper">
      <v-card class="login-card" elevation="8">
        <!-- Header della Card -->
        <div class="login-header">
          <img src="@/assets/logo.png" alt="Logo" class="login-logo" />
          <h1 class="app-name">What's in Your Fridge?</h1>
          <p class="tagline">Trasforma gli ingredienti in deliziose ricette</p>
        </div>

        <!-- Corpo della Card -->
        <v-card-text class="login-body">
          <h2 class="login-title">Accedi</h2>
          
          <v-form ref="form" v-model="valid" @submit.prevent="submit">
            <v-text-field
              v-model="username"
              :error-messages="errorMessages.username"
              :rules="[(v) => !!v || 'Username è obbligatorio']"
              label="Username"
              outlined
              dense
              placeholder="Inserisci il tuo username"
              required
              prepend-inner-icon="mdi-account"
              class="login-input"
            ></v-text-field>
            
            <v-text-field
              v-model="password"
              :error-messages="errorMessages.password"
              :rules="[(v) => !!v || 'Password è obbligatoria']"
              label="Password"
              type="password"
              outlined
              dense
              placeholder="Inserisci la tua password"
              required
              prepend-inner-icon="mdi-lock"
              class="login-input"
            ></v-text-field>

            <div class="additional-options">
              <v-checkbox
                v-model="rememberMe"
                label="Ricordami"
                color="var(--primary)"
                hide-details
                dense
                class="remember-me"
              ></v-checkbox>
              
              <a href="#" class="forgot-password">Password dimenticata?</a>
            </div>
            
            <v-btn 
              block 
              color="var(--primary)" 
              height="48" 
              class="login-btn" 
              :disabled="!valid"
              @click="submit" 
              elevation="2"
            >
              <v-icon left>mdi-login</v-icon>
              Accedi
            </v-btn>
          </v-form>

          <div class="divider-container">
            <div class="divider"></div>
            <span class="divider-text">oppure</span>
            <div class="divider"></div>
          </div>
          
          <!-- Social Login -->
          <div class="social-login">
            <v-btn
              outlined
              block
              height="48"
              class="google-btn"
            >
              <div id="google-button" class="google-btn-container"></div>
            </v-btn>
          </div>
        </v-card-text>
        
        <!-- Footer della Card -->
        <v-card-actions class="login-footer">
          <p>
            Non hai un account?
            <a @click="goToRegister" class="register-link">Registrati</a>
          </p>
        </v-card-actions>
      </v-card>
      
      <!-- Decorazione a destra con immagini di cibo -->
      <div class="login-decoration" v-if="!isMobile">
        <div class="food-img food-img-1">
          <img src="@/assets/img/pasta.jpg" alt="Pasta" />
        </div>
        <div class="food-img food-img-2">
          <img src="@/assets/img/tiramisu.jpg" alt="Tiramisu" />
        </div>
        <div class="food-img food-img-3">
          <img src="@/assets/img/butter_chicken.jpg" alt="Butter Chicken" />
        </div>
      </div>
    </div>
  </div>
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
      rememberMe: false,
      errorMessages: {
        username: "",
        password: "",
      },
      showAlert: false,
      alertMessage: "",
      alertType: "success",
      isMobile: false,
      windowWidth: window.innerWidth
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
          
          if (this.rememberMe) {
            localStorage.setItem("rememberUser", this.username);
          } else {
            localStorage.removeItem("rememberUser");
          }

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
    handleResize() {
      this.windowWidth = window.innerWidth;
      this.isMobile = window.innerWidth < 960;
    }
  },
  mounted() {
    // Configura Google Sign-In
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
        text: "signin_with",
        shape: "rectangular",
        width: "100%"
      });
    };
    document.head.appendChild(script);
    
    // Carica username salvato se presente
    const savedUsername = localStorage.getItem("rememberUser");
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
    }
    
    // Configura responsive design
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.login-card-wrapper {
  display: flex;
  width: 100%;
  max-width: 1000px;
  box-shadow: var(--shadow-strong);
  border-radius: var(--radius-large);
  overflow: hidden;
  background-color: white;
}

.login-card {
  flex: 1;
  border-radius: 0;
  box-shadow: none !important;
  display: flex;
  flex-direction: column;
}

.login-header {
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  padding: 32px 24px;
  text-align: center;
  color: white;
}

.login-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 16px;
  filter: brightness(0) invert(1);
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.tagline {
  font-size: 15px;
  opacity: 0.9;
  margin: 0;
}

.login-body {
  padding: 32px 24px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-align: center;
}

.login-input {
  margin-bottom: 16px;
}

.additional-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-me {
  margin: 0;
}

.forgot-password {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.forgot-password:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.login-btn {
  text-transform: none !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  letter-spacing: 0.5px !important;
  margin-bottom: 24px !important;
}

.divider-container {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.divider {
  flex: 1;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
}

.divider-text {
  padding: 0 16px;
  color: var(--text-hint);
  font-size: 14px;
}

.social-login {
  margin-bottom: 16px;
}

.google-btn {
  background-color: transparent !important;
  box-shadow: none !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  position: relative;
  overflow: hidden;
}

.google-btn-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.login-footer {
  margin-top: auto;
  padding: 16px 24px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.login-footer p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.register-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.register-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Decorazione con immagini di cibo */
.login-decoration {
  position: relative;
  width: 380px;
  background-color: var(--primary-light);
  overflow: hidden;
}

.food-img {
  position: absolute;
  border-radius: var(--radius-medium);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.food-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.food-img-1 {
  width: 280px;
  height: 200px;
  top: 80px;
  left: 50px;
  transform: rotate(-5deg);
  z-index: 3;
}

.food-img-2 {
  width: 240px;
  height: 180px;
  top: 240px;
  left: 140px;
  transform: rotate(3deg);
  z-index: 2;
}

.food-img-3 {
  width: 260px;
  height: 190px;
  top: 380px;
  left: 60px;
  transform: rotate(-2deg);
  z-index: 1;
}

@media (max-width: 959px) {
  .login-card-wrapper {
    flex-direction: column;
    max-width: 460px;
  }
  
  .login-decoration {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-header {
    padding: 24px 16px;
  }
  
  .login-logo {
    width: 60px;
    height: 60px;
  }
  
  .app-name {
    font-size: 24px;
  }
  
  .tagline {
    font-size: 14px;
  }
  
  .login-body {
    padding: 24px 16px;
  }
  
  .login-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .additional-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
