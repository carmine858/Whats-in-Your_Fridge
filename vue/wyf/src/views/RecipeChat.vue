<template>
    <div class="recipe-chat-page">
      <div class="container">
        <h1>Chef Virtuale</h1>
        <div class="content-wrapper">
          <!-- Selezione ingredienti -->
          <div class="ingredients-panel">
            <h2>Ingredienti disponibili</h2>
            <div class="ingredients-list">
              <div v-for="(ingredient, index) in availableIngredients" :key="index" class="ingredient-item">
                <label>
                  <input type="checkbox" v-model="selectedIngredients" :value="ingredient">
                  {{ ingredient }}
                </label>
              </div>
            </div>
            <button @click="askForRecipe" class="ask-button">Chiedi una ricetta</button>
          </div>
          
          <!-- Chat -->
          <div class="chat-panel">
            <div class="chat-messages" ref="chatBox">
              <div v-for="(message, index) in messages" :key="index" 
                   :class="['message', message.sender === 'user' ? 'user-message' : 'chef-message']">
                <div class="message-content">
                  <strong>{{ message.sender === 'user' ? 'Tu' : 'Chef Virtuale' }}:</strong> 
                  <p v-html="message.text"></p>
                </div>
              </div>
            </div>
            <div class="chat-input">
              <input type="text" v-model="userInput" @keyup.enter="sendMessage" placeholder="Scrivi un messaggio...">
              <button @click="sendMessage">Invia</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import io from 'socket.io-client';
  
  export default {
    name: 'RecipeChat',
    data() {
      return {
        socket: null,
        userInput: '',
        messages: [],
        availableIngredients: [
          'Pomodori', 'Pasta', 'Uova', 'Formaggio', 'Cipolla', 
          'Aglio', 'Patate', 'Carote', 'Zucchine', 'Melanzane',
          'Peperoni', 'Funghi', 'Riso', 'Carne macinata', 'Pollo',
          'Salmone', 'Tonno', 'Farina', 'Burro', 'Latte'
        ],
        selectedIngredients: []
      };
    },
    mounted() {
      this.connectSocket();
      
      // Messaggio di benvenuto
      this.messages.push({
        sender: 'chef',
        text: 'Ciao! Sono il tuo chef virtuale. Seleziona gli ingredienti che hai a disposizione e ti suggerirò cosa cucinare!'
      });
    },
    methods: {
      connectSocket() {
        // Usa la tua URL del server o prendi da variabili d'ambiente
        this.socket = io(process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000');
        
        this.socket.on('recipe-suggestion', (data) => {
          this.messages.push({
            sender: 'chef',
            text: data.message
          });
          this.scrollToBottom();
        });
        
        this.socket.on('typing', () => {
          // Potremmo mostrare "Chef sta scrivendo..."
        });
      },
      sendMessage() {
        if (!this.userInput.trim()) return;
        
        const message = {
          sender: 'user',
          text: this.userInput
        };
        
        this.messages.push(message);
        this.socket.emit('chat-message', { message: this.userInput });
        this.userInput = '';
        this.scrollToBottom();
      },
      askForRecipe() {
        if (this.selectedIngredients.length === 0) {
          this.messages.push({
            sender: 'chef',
            text: 'Per favore, seleziona almeno un ingrediente!'
          });
          return;
        }
        
        const ingredientsText = this.selectedIngredients.join(', ');
        const message = {
          sender: 'user',
          text: `Vorrei una ricetta con questi ingredienti: ${ingredientsText}`
        };
        
        this.messages.push(message);
        this.socket.emit('request-recipe', { ingredients: this.selectedIngredients });
        this.scrollToBottom();
      },
      scrollToBottom() {
        this.$nextTick(() => {
          if (this.$refs.chatBox) {
            this.$refs.chatBox.scrollTop = this.$refs.chatBox.scrollHeight;
          }
        });
      }
    },
    beforeUnmount() {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }
  </script>
  
  <style scoped>
  .recipe-chat-page {
    padding: 20px;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  h1 {
    text-align: center;
    color: #ffffff;
    margin-bottom: 20px;
  }
  
  .content-wrapper {
    display: flex;
    gap: 20px;
    height: 80vh;
  }
  
  @media (max-width: 768px) {
    .content-wrapper {
      flex-direction: column;
      height: auto;
    }
    
    .ingredients-panel, .chat-panel {
      height: 50vh;
    }
  }
  
  .ingredients-panel, .chat-panel {
    flex: 1;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
  }
  
  .ingredients-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: white;
    border-radius: 5px;
    margin-bottom: 15px;
  }
  
  .ingredient-item {
    margin-bottom: 10px;
  }
  
  .ask-button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: white;
    border-radius: 5px;
    margin-bottom: 15px;
  }
  
  .message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
  }
  
  .user-message {
    background: #e3f2fd;
    margin-left: auto;
  }
  
  .chef-message {
    background: #f1f8e9;
    margin-right: auto;
  }
  
  .chat-input {
    display: flex;
    gap: 10px;
  }
  
  .chat-input input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  .chat-input button {
    background: #2196F3;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
  }
  </style>