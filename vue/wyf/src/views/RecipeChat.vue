<template>
    <div class="recipe-chat-page">
      <div class="container">
        <h1>Chef Virtuale <span class="chef-hat">👨‍🍳</span></h1>
        <div class="content-wrapper">
          <!-- Selezione ingredienti -->
          <div class="ingredients-panel">
            <h2>Ingredienti disponibili</h2>
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchIngredient" 
                placeholder="Cerca ingredienti..." 
                @input="filterIngredients"
              />
              <span class="search-icon">🔍</span>
            </div>
            <div class="ingredients-list">
              <div v-for="(ingredient, index) in filteredIngredients" :key="index" class="ingredient-item">
                <label>
                  <input type="checkbox" v-model="selectedIngredients" :value="ingredient">
                  <span class="ingredient-name">{{ ingredient }}</span>
                </label>
              </div>
              <div v-if="filteredIngredients.length === 0" class="no-results">
                Nessun ingrediente trovato
              </div>
            </div>
            
            <div class="filters-section">
              <h3>Filtri dietetici</h3>
              <div class="filter-items">
                <label class="filter-item">
                  <input type="checkbox" v-model="dietaryFilters.vegetarian">
                  <span class="filter-label">Vegetariano 🥗</span>
                </label>
                <label class="filter-item">
                  <input type="checkbox" v-model="dietaryFilters.vegan">
                  <span class="filter-label">Vegano 🌱</span>
                </label>
                <label class="filter-item">
                  <input type="checkbox" v-model="dietaryFilters.glutenFree">
                  <span class="filter-label">Senza Glutine 🌾</span>
                </label>
              </div>
            </div>
            
            <button @click="askForRecipe" class="ask-button">
              <span class="button-icon">🍽️</span> Chiedi una ricetta
            </button>
          </div>
          
          <!-- Chat -->
          <div class="chat-panel">
            <div class="chat-header">
              <div class="chef-avatar">👨‍🍳</div>
              <div class="chat-title">Chat con Chef Virtuale</div>
            </div>
            
            <div class="chat-messages" ref="chatBox">
              <div v-for="(message, index) in messages" :key="index" 
                   :class="['message', message.sender === 'user' ? 'user-message' : 'chef-message']">
                <div class="avatar">{{ message.sender === 'user' ? '👤' : '👨‍🍳' }}</div>
                <div class="message-content">
                  <div class="message-sender">{{ message.sender === 'user' ? 'Tu' : 'Chef Virtuale' }}</div> 
                  <div class="message-text" v-html="message.text"></div>
                  
                  <!-- Mostra dettagli della ricetta se disponibili -->
                  <div v-if="message.recipes && message.recipes.length > 0" class="recipe-actions">
                    <button 
                      v-for="(recipe, recipeIndex) in message.recipes" 
                      :key="recipeIndex"
                      @click="getRecipeDetails(recipe.id)"
                      class="recipe-detail-btn"
                    >
                      <span class="recipe-icon">📖</span> {{ recipe.titolo }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Indicatore "Sta scrivendo" -->
              <div v-if="isTyping" class="typing-indicator">
                <div class="typing-avatar">👨‍🍳</div>
                <div class="typing-bubbles">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            
            <div class="chat-input">
              <input 
                type="text" 
                v-model="userInput" 
                @keyup.enter="sendMessage" 
                @input="handleTyping"
                placeholder="Scrivi un messaggio..."
              >
              <button @click="sendMessage">
                <span class="send-icon">📤</span>
              </button>
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
          'Salmone', 'Tonno', 'Farina', 'Burro', 'Latte',
          'Parmigiano', 'Mozzarella', 'Basilico', 'Prezzemolo', 'Rosmarino',
          'Spinaci', 'Insalata', 'Pesce', 'Maiale', 'Manzo',
          'Yogurt', 'Ricotta', 'Fagioli', 'Ceci', 'Lenticchie'
        ],
        selectedIngredients: [],
        searchIngredient: '',
        filteredIngredients: [],
        isTyping: false,
        typingTimeout: null,
        dietaryFilters: {
          vegetarian: false,
          vegan: false,
          glutenFree: false
        }
      };
    },
    mounted() {
      this.connectSocket();
      this.filteredIngredients = [...this.availableIngredients];
      
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
          this.isTyping = false;
          
          const message = {
            sender: 'chef',
            text: data.message
          };
          
          // Aggiungi ricette se presenti nella risposta
          if (data.recipes && data.recipes.length > 0) {
            message.recipes = data.recipes;
          }
          
          this.messages.push(message);
          this.scrollToBottom();
        });
        
        this.socket.on('typing', (data) => {
          this.isTyping = data.status;
          this.scrollToBottom();
        });
        
        this.socket.on('recipe-details-response', (data) => {
          if (data.recipe) {
            const recipeDetails = `
              <div class="recipe-details">
                <h3>${data.recipe.titolo}</h3>
                <p><strong>Difficoltà:</strong> ${data.recipe.difficolta}</p>
                <p><strong>Tipo:</strong> ${data.recipe.tipo}</p>
                <p><strong>Ingredienti essenziali:</strong> ${data.recipe.ingredienti_essenziali.join(', ')}</p>
                ${data.recipe.ingredienti_aggiuntivi && data.recipe.ingredienti_aggiuntivi.length > 0 ? 
                  `<p><strong>Ingredienti aggiuntivi:</strong> ${data.recipe.ingredienti_aggiuntivi.join(', ')}</p>` : ''}
                <p><strong>Istruzioni:</strong> ${data.recipe.istruzioni}</p>
              </div>
            `;
            
            this.messages.push({
              sender: 'chef',
              text: recipeDetails
            });
            
            this.scrollToBottom();
          }
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
        
        // Invia anche i filtri dietetici al server
        this.socket.emit('request-recipe', { 
          ingredients: this.selectedIngredients,
          filters: this.dietaryFilters
        });
        
        this.scrollToBottom();
      },
      scrollToBottom() {
        this.$nextTick(() => {
          if (this.$refs.chatBox) {
            this.$refs.chatBox.scrollTop = this.$refs.chatBox.scrollHeight;
          }
        });
      },
      filterIngredients() {
        if (!this.searchIngredient) {
          this.filteredIngredients = [...this.availableIngredients];
          return;
        }
        
        const search = this.searchIngredient.toLowerCase();
        this.filteredIngredients = this.availableIngredients.filter(
          ingredient => ingredient.toLowerCase().includes(search)
        );
      },
      handleTyping() {
        // Invia al server l'evento che l'utente sta scrivendo
        this.socket.emit('user-typing', { typing: true });
        
        // Cancella il timeout precedente se esiste
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        
        // Imposta un nuovo timeout per inviare l'evento di fine digitazione
        this.typingTimeout = setTimeout(() => {
          this.socket.emit('user-typing', { typing: false });
        }, 1000);
      },
      getRecipeDetails(recipeId) {
        this.socket.emit('recipe-details', { recipeId });
      }
    },
    beforeUnmount() {
      if (this.socket) {
        this.socket.disconnect();
      }
      
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
    }
  }
  </script>
  
  <style scoped>
  .recipe-chat-page {
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 30px;
    font-size: 2.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  }
  
  .chef-hat {
    font-size: 2rem;
    vertical-align: middle;
    margin-left: 10px;
    animation: bounce 2s infinite;
  }
  
  .content-wrapper {
    display: flex;
    gap: 25px;
    height: 80vh;
    perspective: 1000px;
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
    background: rgba(255, 255, 255, 0.9);
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    backdrop-filter: blur(10px);
  }
  
  .ingredients-panel:hover, .chat-panel:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }
  
  .search-box {
    margin-bottom: 15px;
    position: relative;
  }
  
  .search-box input {
    width: 100%;
    padding: 12px 40px 12px 15px;
    border: none;
    border-radius: 50px;
    background: #f0f2f5;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
    font-size: 1rem;
    transition: all 0.3s ease;
  }
  
  .search-box input:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3498db;
    background: #fff;
  }
  
  .search-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: #7f8c8d;
  }
  
  .ingredients-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background: linear-gradient(to bottom, #ffffff, #f7f9fc);
    border-radius: 10px;
    margin-bottom: 15px;
    scrollbar-width: thin;
    scrollbar-color: #bdc3c7 #ecf0f1;
  }
  
  .ingredients-list::-webkit-scrollbar {
    width: 8px;
  }
  
  .ingredients-list::-webkit-scrollbar-track {
    background: #ecf0f1;
    border-radius: 10px;
  }
  
  .ingredients-list::-webkit-scrollbar-thumb {
    background: #bdc3c7;
    border-radius: 10px;
  }
  
  .ingredient-item {
    margin-bottom: 15px;
    transition: transform 0.2s ease;
  }
  
  .ingredient-item:hover {
    transform: translateX(5px);
  }
  
  .ingredient-item label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .ingredient-item input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #3498db;
    border-radius: 5px;
    margin-right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .ingredient-item input[type="checkbox"]:checked {
    background-color: #3498db;
  }
  
  .ingredient-item input[type="checkbox"]:checked::after {
    content: "✓";
    color: white;
    font-size: 14px;
  }
  
  .ingredient-name {
    font-size: 1rem;
    color: #34495e;
  }
  
  .filters-section {
    background: linear-gradient(to right, #e0eafc, #cfdef3);
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
    border-left: 4px solid #3498db;
  }
  
  .filters-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
    color: #2c3e50;
  }
  
  .filter-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .filter-item {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.7);
    padding: 8px 12px;
    border-radius: 30px;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .filter-item:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  }
  
  .filter-label {
    margin-left: 8px;
  }
  
  .ask-button {
    background: linear-gradient(to right, #11998e, #38ef7d);
    color: white;
    border: none;
    padding: 14px 20px;
    border-radius: 50px;
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
  }
  
  .ask-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
  }
  
  .button-icon {
    margin-right: 10px;
    font-size: 18px;
  }
  
  .chat-panel {
    position: relative;
  }
  
  .chat-header {
    display: flex;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
    margin-bottom: 15px;
  }
  
  .chef-avatar {
    font-size: 24px;
    margin-right: 15px;
    background: #f39c12;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    animation: float 3s ease-in-out infinite;
  }
  
  .chat-title {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 15px;
    scrollbar-width: thin;
    scrollbar-color: #bdc3c7 #ecf0f1;
    display: flex;
    flex-direction: column;
  }
  
  .chat-messages::-webkit-scrollbar {
    width: 8px;
  }
  
  .chat-messages::-webkit-scrollbar-track {
    background: #ecf0f1;
    border-radius: 10px;
  }
  
  .chat-messages::-webkit-scrollbar-thumb {
    background: #bdc3c7;
    border-radius: 10px;
  }
  
  .message {
    display: flex;
    margin-bottom: 20px;
    max-width: 90%;
  }
  
  .user-message {
    flex-direction: row-reverse;
    align-self: flex-end;
  }
  
  .chef-message {
    align-self: flex-start;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    background: #ecf0f1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  
  .user-message .avatar {
    margin-left: 12px;
    background: #3498db;
  }
  
  .chef-message .avatar {
    margin-right: 12px;
    background: #e67e22;
  }
  
  .message-content {
    padding: 12px 15px;
    border-radius: 18px;
    position: relative;
  }
  
  .user-message .message-content {
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    color: white;
    border-top-right-radius: 2px;
  }
  
  .chef-message .message-content {
    background: white;
    border-top-left-radius: 2px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  
  .message-sender {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 5px;
  }
  
  .message-text {
    line-height: 1.5;
  }
  
  .chat-input {
    display: flex;
    gap: 10px;
    padding-top: 15px;
    border-top: 1px solid #ecf0f1;
  }
  
  .chat-input input {
    flex: 1;
    padding: 14px 20px;
    border: none;
    border-radius: 30px;
    background: #f0f2f5;
    font-size: 1rem;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
  }
  
  .chat-input input:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3498db;
    background: #fff;
  }
  
  .chat-input button {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, #00b09b, #96c93d);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 176, 155, 0.3);
    transition: all 0.3s ease;
  }
  
  .chat-input button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 15px rgba(0, 176, 155, 0.4);
  }
  
  .typing-indicator {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    animation: fadeIn 0.5s ease;
  }
  
  .typing-avatar {
    width: 36px;
    height: 36px;
    background: #e67e22;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-right: 12px;
  }
  
  .typing-bubbles {
    background: white;
    padding: 12px 15px;
    border-radius: 18px;
    border-top-left-radius: 2px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .typing-bubbles span {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    background: #e0e0e0;
    display: block;
    animation: typing 1.2s infinite ease-in-out;
    opacity: 0.7;
  }
  
  .typing-bubbles span:nth-child(1) {
    animation-delay: 0.2s;
  }
  
  .typing-bubbles span:nth-child(2) {
    animation-delay: 0.4s;
  }
  
  .typing-bubbles span:nth-child(3) {
    animation-delay: 0.6s;
  }
  
  .no-results {
    color: #7f8c8d;
    font-style: italic;
    text-align: center;
    padding: 20px 0;
  }
  
  .recipe-actions {
    margin-top: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .recipe-detail-btn {
    background: linear-gradient(135deg, #f2994a, #f2c94c);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    box-shadow: 0 3px 8px rgba(242, 153, 74, 0.3);
    transition: all 0.2s ease;
  }
  
  .recipe-detail-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(242, 153, 74, 0.4);
  }
  
  .recipe-icon {
    margin-right: 5px;
  }
  
  .recipe-details {
    background: linear-gradient(to right, #fff9c4, #fffde7);
    padding: 15px;
    border-radius: 12px;
    border-left: 4px solid #f39c12;
    margin-top: 10px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.05);
    animation: fadeIn 0.5s ease;
  }
  
  .recipe-details h3 {
    margin-top: 0;
    color: #d35400;
    font-size: 20px;
    border-bottom: 2px dashed #f39c12;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }
  
  .recipe-details p {
    margin: 8px 0;
  }
  
  .send-icon {
    font-size: 20px;
  }
  
  @keyframes typing {
    0% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-5px) scale(1.3);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-5px);
    }
    100% {
      transform: translateY(0px);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  </style>