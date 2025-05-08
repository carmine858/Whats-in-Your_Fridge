<template>
  <div class="shopping-list-container">
    <!-- Animated background elements -->
    <div class="animated-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>
    
    <div class="header-section glass-panel">
      <div class="app-title">
        <i class="material-icons title-icon">shopping_cart</i>
        <h1>La Tua Lista della Spesa</h1>
      </div>
      
      <!-- Progress bar showing purchased items percentage -->
      <div class="progress-container" v-if="items.length > 0">
        <div class="progress-info">
          <span>Completamento</span>
          <span>{{ Math.round((purchasedCount / items.length) * 100) }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(purchasedCount / items.length) * 100}%` }"></div>
        </div>
      </div>
      
      <div class="alerts-panel glass-panel" v-if="hasExpiryAlerts">
        <div class="alerts-header">
          <div class="alert-title">
            <i class="material-icons pulse">notifications_active</i>
            <h3>Avvisi di scadenza</h3>
          </div>
          <button @click="showExpiryAlerts = !showExpiryAlerts" class="toggle-button pulse-on-hover">
            <i class="material-icons">{{ showExpiryAlerts ? 'visibility_off' : 'visibility' }}</i>
            {{ showExpiryAlerts ? 'Nascondi' : 'Mostra' }}
          </button>
        </div>
        <div class="alerts-content" v-if="showExpiryAlerts">
          <transition-group name="alert-list">
            <div class="alert expired" v-for="item in alerts.expired" :key="'expired-' + item.id">
              <i class="material-icons">warning</i>
              <span>{{ item.message }}</span>
            </div>
            <div class="alert today" v-for="item in alerts.today" :key="'today-' + item.id">
              <i class="material-icons">today</i>
              <span>{{ item.message }}</span>
            </div>
            <div class="alert soon" v-for="item in alerts.soon" :key="'soon-' + item.id">
              <i class="material-icons">schedule</i>
              <span>{{ item.message }}</span>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
    
    <div class="content-container">
      <div class="shopping-panel glass-panel">
        <div class="add-item-section">
          <div class="section-title">
            <i class="material-icons section-icon">add_shopping_cart</i>
            <h2>Aggiungi ingrediente</h2>
          </div>
          <form @submit.prevent="addItem" class="add-item-form glass-inner">
            <div class="form-row">
              <div class="form-group">
                <label for="item-name">Nome ingrediente *</label>
                <input 
                  id="item-name" 
                  type="text" 
                  v-model="newItem.item_name" 
                  placeholder="Es. Pomodori" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="quantity">Quantità</label>
                <input 
                  id="quantity" 
                  type="text" 
                  v-model="newItem.quantity" 
                  placeholder="Es. 500g"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="category">Categoria</label>
                <select id="category" v-model="newItem.category">
                  <option value="">-- Seleziona --</option>
                  <option value="frutta">Frutta</option>
                  <option value="verdura">Verdura</option>
                  <option value="latticini">Latticini</option>
                  <option value="carne">Carne</option>
                  <option value="pesce">Pesce</option>
                  <option value="pasta-riso">Pasta e Riso</option>
                  <option value="prodotti-da-forno">Prodotti da forno</option>
                  <option value="bevande">Bevande</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
              <div class="form-group">
                <label for="expiry-date">Data di scadenza</label>
                <input 
                  id="expiry-date" 
                  type="date" 
                  v-model="newItem.expiry_date" 
                />
              </div>
            </div>
            <div class="action-buttons">
              <button type="submit" class="add-button">
                <i class="material-icons">add</i> Aggiungi
              </button>
              <button type="button" class="clear-button" @click="clearForm">
                <i class="material-icons">clear</i> Pulisci
              </button>
            </div>
          </form>
        </div>
        
        <div class="filter-section glass-inner">
          <div class="search-box">
            <i class="material-icons search-icon">search</i>
            <input 
              type="text" 
              v-model="filterText" 
              placeholder="Cerca ingredienti..." 
              @input="applyFilters"
            />
          </div>
          <div class="filters">
            <div class="filter-dropdown">
              <i class="material-icons">category</i>
              <select v-model="filterCategory" @change="applyFilters">
                <option value="">Tutte le categorie</option>
                <option value="frutta">Frutta</option>
                <option value="verdura">Verdura</option>
                <option value="latticini">Latticini</option>
                <option value="carne">Carne</option>
                <option value="pesce">Pesce</option>
                <option value="pasta-riso">Pasta e Riso</option>
                <option value="prodotti-da-forno">Prodotti da forno</option>
                <option value="bevande">Bevande</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div class="filter-dropdown">
              <i class="material-icons">filter_list</i>
              <select v-model="filterStatus" @change="applyFilters">
                <option value="">Tutti gli stati</option>
                <option value="unpurchased">Da acquistare</option>
                <option value="purchased">Acquistati</option>
                <option value="expiring-soon">In scadenza</option>
              </select>
            </div>
            <button class="sort-button glow-on-hover" @click="toggleSortOrder">
              <i class="material-icons">{{ sortAscending ? 'arrow_upward' : 'arrow_downward' }}</i>
              {{ sortAscending ? 'A-Z' : 'Z-A' }}
            </button>
          </div>
        </div>
        
        <div class="view-toggle">
          <button :class="{'active': viewMode === 'list'}" @click="viewMode = 'list'">
            <i class="material-icons">view_list</i>
          </button>
          <button :class="{'active': viewMode === 'grid'}" @click="viewMode = 'grid'">
            <i class="material-icons">grid_view</i>
          </button>
        </div>
        
        <div class="items-container">
          <div v-if="loading" class="loading-spinner">
            <div class="spinner"></div>
            <p>Caricamento in corso...</p>
          </div>
          
          <div v-else-if="filteredItems.length === 0" class="empty-list">
            <div class="empty-animation">
              <i class="material-icons">shopping_basket</i>
            </div>
            <p>Nessun ingrediente nella lista della spesa</p>
            <p v-if="filterActive">Prova a cambiare i filtri</p>
            <button @click="clearForm" class="add-first-item pulse-button">
              <i class="material-icons">add_circle</i> Aggiungi il tuo primo ingrediente
            </button>
          </div>
          
          <transition-group 
            name="item-list" 
            tag="div" 
            :class="['items-list', viewMode === 'grid' ? 'grid-view' : 'list-view']"
          >
            <div 
              v-for="item in filteredItems" 
              :key="item.id" 
              class="shopping-item"
              :class="{
                'purchased': item.purchased,
                'expiring-soon': isExpiringSoon(item),
                'expired': isExpired(item),
                'grid-item': viewMode === 'grid'
              }"
            >
              <div class="item-category-icon">
                <i class="material-icons">{{ getCategoryIcon(item.category) }}</i>
              </div>
              <div class="item-status">
                <label :for="'item-' + item.id" class="fancy-checkbox">
                  <input 
                    :id="'item-' + item.id" 
                    type="checkbox" 
                    :checked="item.purchased === 1" 
                    @change="toggleItemStatus(item)" 
                  />
                  <span class="checkmark">
                    <i class="material-icons check-icon">check</i>
                  </span>
                </label>
              </div>
              <div class="item-details" @click="toggleItemStatus(item)">
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-meta">
                  <span v-if="item.quantity" class="quantity">{{ item.quantity }}</span>
                  <span v-if="item.category" class="category">{{ getCategoryName(item.category) }}</span>
                  <span v-if="item.expiry_date" class="expiry-date" :class="getExpiryClass(item)">
                    <i class="material-icons">event</i> {{ formatDate(item.expiry_date) }}
                  </span>
                </div>
              </div>
              <div class="item-actions">
                <button class="edit-button action-button" @click="editItem(item)">
                  <i class="material-icons">edit</i>
                </button>
                <button class="delete-button action-button" @click="deleteItem(item)">
                  <i class="material-icons">delete</i>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
      
      <!-- Modal per modifica ingrediente -->
      <div class="modal-backdrop" v-if="showEditModal" @click="showEditModal = false">
        <div class="modal-content glass-panel" @click.stop>
          <div class="modal-header">
            <h3><i class="material-icons">edit</i> Modifica Ingrediente</h3>
            <button class="close-button" @click="showEditModal = false">
              <i class="material-icons">close</i>
            </button>
          </div>
          <form @submit.prevent="updateItem">
            <div class="form-group">
              <label for="edit-item-name">Nome ingrediente *</label>
              <input 
                id="edit-item-name" 
                type="text" 
                v-model="editingItem.item_name" 
                placeholder="Es. Pomodori" 
                required
              />
            </div>
            <div class="form-group">
              <label for="edit-quantity">Quantità</label>
              <input 
                id="edit-quantity" 
                type="text" 
                v-model="editingItem.quantity" 
                placeholder="Es. 500g"
              />
            </div>
            <div class="form-group">
              <label for="edit-category">Categoria</label>
              <select id="edit-category" v-model="editingItem.category">
                <option value="">-- Seleziona --</option>
                <option value="frutta">Frutta</option>
                <option value="verdura">Verdura</option>
                <option value="latticini">Latticini</option>
                <option value="carne">Carne</option>
                <option value="pesce">Pesce</option>
                <option value="pasta-riso">Pasta e Riso</option>
                <option value="prodotti-da-forno">Prodotti da forno</option>
                <option value="bevande">Bevande</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-expiry-date">Data di scadenza</label>
              <input 
                id="edit-expiry-date" 
                type="date" 
                v-model="editingItem.expiry_date" 
              />
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-container">
                <input type="checkbox" v-model="editingItem.purchased">
                <span class="checkmark"></span>
                Ingrediente già acquistato
              </label>
            </div>
            <div class="modal-buttons">
              <button type="button" class="cancel-button" @click="showEditModal = false">
                Annulla
              </button>
              <button type="submit" class="save-button">
                <i class="material-icons">save</i> Salva
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Toast notifications -->
      <div class="toast-container">
        <transition-group name="toast">
          <div 
            v-for="toast in toasts" 
            :key="toast.id" 
            class="toast glass-panel" 
            :class="toast.type"
          >
            <i class="material-icons">{{ toast.icon }}</i>
            <span>{{ toast.message }}</span>
          </div>
        </transition-group>
      </div>
      
      <!-- Confetti animation for completed items -->
      <div class="confetti-container" v-if="showConfetti">
        <div v-for="i in 50" :key="i" class="confetti" 
             :style="{ 
               '--fall-delay': `${Math.random() * 5}s`, 
               '--fall-duration': `${Math.random() * 5 + 3}s`,
               '--left-pos': `${Math.random() * 100}%`,
               '--bg-color': getRandomConfettiColor(),
               '--rotation': `${Math.random() * 360}deg`,
               '--size': `${Math.random() * 10 + 5}px`
             }">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShoppingListView',
  data() {
    return {
      items: [],
      filteredItems: [],
      loading: true,
      newItem: {
        item_name: '',
        quantity: '',
        category: '',
        expiry_date: ''
      },
      filterText: '',
      filterCategory: '',
      filterStatus: '',
      sortAscending: true,
      showEditModal: false,
      editingItem: null,
      alerts: {
        expired: [],
        today: [],
        soon: []
      },
      showExpiryAlerts: true,
      toasts: [],
      showConfetti: false,
      confettiTimeout: null,
      viewMode: 'list'
    };
  },
  computed: {
    filterActive() {
      return this.filterText !== '' || this.filterCategory !== '' || this.filterStatus !== '';
    },
    hasExpiryAlerts() {
      return this.alerts.expired.length > 0 || this.alerts.today.length > 0 || this.alerts.soon.length > 0;
    },
    purchasedCount() {
      return this.items.filter(item => item.purchased === 1).length;
    }
  },
  async mounted() {
    await this.fetchItems();
    await this.fetchExpiryAlerts();
    this.loading = false;
  },
  methods: {
    async fetchItems() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/');
          return;
        }
        
        const response = await fetch('http://localhost:3000/shopping-list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Errore nel recupero della lista della spesa');
        }
        
        const data = await response.json();
        this.items = data.items || [];
        this.applyFilters();
      } catch (error) {
        console.error('Errore:', error);
        this.showToast('Errore nel caricamento degli ingredienti', 'error');
      }
    },
    
    async fetchExpiryAlerts() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        
        const response = await fetch('http://localhost:3000/shopping-list/expiry-alerts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Errore nel recupero degli avvisi di scadenza');
        }
        
        const data = await response.json();
        this.alerts = data.alerts;
      } catch (error) {
        console.error('Errore negli avvisi di scadenza:', error);
      }
    },
    
    async addItem() {
      try {
        // Validazione minima
        if (!this.newItem.item_name.trim()) {
          this.showToast('Il nome dell\'ingrediente è obbligatorio', 'error');
          return;
        }
        
        this.loading = true;
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:3000/shopping-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.newItem)
        });
        
        if (!response.ok) {
          throw new Error('Errore nell\'aggiunta dell\'ingrediente');
        }
        
        const result = await response.json();
        
        // Aggiungi l'id restituito dal server all'elemento per aggiornare localmente
        this.items.push({
          id: result.id,
          ...this.newItem,
          purchased: 0
        });
        
        this.showToast('Ingrediente aggiunto con successo', 'success');
        this.clearForm();
        this.applyFilters();
      } catch (error) {
        console.error('Errore:', error);
        this.showToast('Errore nell\'aggiunta dell\'ingrediente', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    clearForm() {
      this.newItem = {
        item_name: '',
        quantity: '',
        category: '',
        expiry_date: ''
      };
    },
    
    toggleItemStatus(item) {
      const previousState = item.purchased;
      
      this.toggleItemStatusInDB(item).then(() => {
        // If the item was marked as purchased (and wasn't before), show confetti
        if (item.purchased === 1 && previousState === 0) {
          this.triggerConfetti();
        }
      });
    },
    
    async toggleItemStatusInDB(item) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/shopping-list/toggle/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Errore nell\'aggiornamento dello stato');
        }
        
        const result = await response.json();
        
        // Aggiorna l'elemento localmente
        item.purchased = result.purchased ? 1 : 0;
        
        if (result.purchased) {
          this.showToast('Ingrediente segnato come acquistato', 'success');
        } else {
          this.showToast('Ingrediente segnato come da acquistare', 'info');
        }
      } catch (error) {
        console.error('Errore:', error);
        this.showToast('Errore nell\'aggiornamento dello stato', 'error');
      }
    },
    
    editItem(item) {
      // Crea una copia profonda dell'elemento per evitare modifiche involontarie
      this.editingItem = JSON.parse(JSON.stringify(item));
      // Converte purchased da 0/1 a boolean per il checkbox
      this.editingItem.purchased = this.editingItem.purchased === 1;
      this.showEditModal = true;
    },
    
    async updateItem() {
      try {
        if (!this.editingItem.item_name.trim()) {
          this.showToast('Il nome dell\'ingrediente è obbligatorio', 'error');
          return;
        }
        
        this.loading = true;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/shopping-list/${this.editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            item_name: this.editingItem.item_name,
            quantity: this.editingItem.quantity,
            category: this.editingItem.category,
            expiry_date: this.editingItem.expiry_date,
            purchased: this.editingItem.purchased
          })
        });
        
        if (!response.ok) {
          throw new Error('Errore nell\'aggiornamento dell\'ingrediente');
        }
        
        // Aggiorna l'elemento nella lista locale
        const index = this.items.findIndex(item => item.id === this.editingItem.id);
        if (index !== -1) {
          this.items[index] = {
            ...this.editingItem,
            purchased: this.editingItem.purchased ? 1 : 0
          };
        }
        
        this.showToast('Ingrediente aggiornato con successo', 'success');
        this.showEditModal = false;
        this.applyFilters();
      } catch (error) {
        console.error('Errore:', error);
        this.showToast('Errore nell\'aggiornamento dell\'ingrediente', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async deleteItem(item) {
      if (!confirm(`Sei sicuro di voler eliminare "${item.item_name}" dalla lista della spesa?`)) {
        return;
      }
      
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/shopping-list/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Errore nell\'eliminazione dell\'ingrediente');
        }
        
        // Rimuovi l'elemento dalla lista locale
        this.items = this.items.filter(i => i.id !== item.id);
        this.applyFilters();
        
        this.showToast('Ingrediente eliminato con successo', 'success');
      } catch (error) {
        console.error('Errore:', error);
        this.showToast('Errore nell\'eliminazione dell\'ingrediente', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    applyFilters() {
      let filtered = [...this.items];
      
      // Filtro di ricerca testuale
      if (this.filterText) {
        const searchTerm = this.filterText.toLowerCase();
        filtered = filtered.filter(item => 
          item.item_name.toLowerCase().includes(searchTerm) ||
          (item.quantity && item.quantity.toLowerCase().includes(searchTerm)) ||
          (item.category && item.category.toLowerCase().includes(searchTerm))
        );
      }
      
      // Filtro per categoria
      if (this.filterCategory) {
        filtered = filtered.filter(item => item.category === this.filterCategory);
      }
      
      // Filtro per stato
      if (this.filterStatus) {
        switch (this.filterStatus) {
          case 'purchased':
            filtered = filtered.filter(item => item.purchased === 1);
            break;
          case 'unpurchased':
            filtered = filtered.filter(item => item.purchased === 0);
            break;
          case 'expiring-soon':
            filtered = filtered.filter(item => this.isExpiringSoon(item) || this.isExpired(item));
            break;
        }
      }
      
      // Ordinamento
      filtered.sort((a, b) => {
        let comparison = a.item_name.localeCompare(b.item_name);
        return this.sortAscending ? comparison : -comparison;
      });
      
      this.filteredItems = filtered;
    },
    
    toggleSortOrder() {
      this.sortAscending = !this.sortAscending;
      this.applyFilters();
    },
    
    isExpiringSoon(item) {
      if (!item.expiry_date) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= 3;
    },
    
    isExpired(item) {
      if (!item.expiry_date) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      
      return expiryDate < today;
    },
    
    getExpiryClass(item) {
      if (this.isExpired(item)) return 'expired';
      if (this.isExpiringSoon(item)) return 'expiring-soon';
      return '';
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT');
    },
    
    getCategoryName(category) {
      const categories = {
        'frutta': 'Frutta',
        'verdura': 'Verdura',
        'latticini': 'Latticini',
        'carne': 'Carne',
        'pesce': 'Pesce',
        'pasta-riso': 'Pasta e Riso',
        'prodotti-da-forno': 'Prodotti da forno',
        'bevande': 'Bevande',
        'altro': 'Altro'
      };
      
      return categories[category] || category;
    },
    
    getCategoryIcon(category) {
      const icons = {
        'frutta': 'nutrition',
        'verdura': 'eco',
        'latticini': 'egg',
        'carne': 'restaurant',
        'pesce': 'water',
        'pasta-riso': 'dinner_dining',
        'prodotti-da-forno': 'bakery_dining',
        'bevande': 'local_bar',
        'altro': 'local_grocery_store'
      };
      
      return icons[category] || 'local_grocery_store';
    },
    
    showToast(message, type = 'info') {
      const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
      };
      
      const toast = {
        id: Date.now(),
        message,
        type,
        icon: icons[type] || 'info'
      };
      
      this.toasts.push(toast);
      
      // Rimuovi il toast dopo 3 secondi
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== toast.id);
      }, 3000);
    },
    
    triggerConfetti() {
      this.showConfetti = true;
      
      // Clear any existing timeout
      if (this.confettiTimeout) {
        clearTimeout(this.confettiTimeout);
      }
      
      // Hide confetti after 3 seconds
      this.confettiTimeout = setTimeout(() => {
        this.showConfetti = false;
      }, 3000);
    },
    
    getRandomConfettiColor() {
      const colors = [
        '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
        '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
        '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
        '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* Base styles and modern resets */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.shopping-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Poppins', sans-serif;
  color: #444;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  z-index: 0;
}

/* Animated background */
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(45deg, #6a11cb 0%, #2575fc 100%);
  z-index: -2;
}

.shape {
  position: absolute;
  border-radius: 50%;
  backdrop-filter: blur(5px);
  animation: float 15s infinite ease-in-out;
  opacity: 0.4;
  z-index: -1;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #ff7eb3, #ff758c);
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #ffc3a0, #ffafbd);
  bottom: 20%;
  right: 10%;
  animation-delay: -3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
  bottom: 30%;
  left: 5%;
  animation-delay: -6s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #96fbc4, #f9f586);
  top: 5%;
  right: 15%;
  animation-delay: -9s;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(5%, 10%) rotate(5deg);
  }
  50% {
    transform: translate(10%, -5%) rotate(10deg);
  }
  75% {
    transform: translate(-5%, 5%) rotate(15deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

/* Glass morphism effect */
.glass-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 30px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.glass-panel:hover {
  box-shadow: 0 10px 40px rgba(31, 38, 135, 0.25);
  transform: translateY(-5px);
}

.glass-inner {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 20px;
}

/* App title and header */
.header-section {
  margin-bottom: 30px;
  text-align: center;
  padding-top: 20px;
  padding-bottom: 20px;
}

.app-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.title-icon {
  font-size: 3rem;
  color: #6a11cb;
  margin-right: 15px;
}

h1 {
  color: #2c3e50;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -1px;
  margin: 0;
  background: linear-gradient(45deg, #6a11cb, #2575fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-icon {
  color: #6a11cb;
  font-size: 2rem;
  margin-right: 10px;
}

h2 {
  color: #34495e;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

h3 {
  font-size: 1.3rem;
  color: #34495e;
  margin: 0;
}

/* Progress bar */
.progress-container {
  margin: 20px auto;
  max-width: 400px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #11998e, #38ef7d);
  border-radius: 10px;
  transition: width 0.5s ease;
}

/* Alerts panel */
.alerts-panel {
  margin-top: 20px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.alert-title {
  display: flex;
  align-items: center;
}

.alert-title i {
  color: #f39c12;
  margin-right: 10px;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.toggle-button {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 5px;
}

.pulse-on-hover:hover {
  animation: pulse 1s infinite;
}

.alerts-content {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 10px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  margin-bottom: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.alert:hover {
  transform: translateX(5px);
}

.alert.expired {
  background: rgba(231, 76, 60, 0.2);
  border-left: 4px solid #e74c3c;
}

.alert.today {
  background: rgba(243, 156, 18, 0.2);
  border-left: 4px solid #f39c12;
}

.alert.soon {
  background: rgba(52, 152, 219, 0.2);
  border-left: 4px solid #3498db;
}

.alert i {
  font-size: 20px;
}

.alert-list-enter-active, .alert-list-leave-active {
  transition: all 0.5s;
}

.alert-list-enter-from, .alert-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Forms and inputs */
.add-item-form {
  margin-top: 15px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
}

.form-group input, 
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s;
  color: #34495e;
}

.form-group input:focus, 
.form-group select:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.2);
  outline: none;
  background: rgba(255, 255, 255, 0.9);
}

/* Buttons */
button {
  cursor: pointer;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  color: #34495e;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.add-button {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
}

.add-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 14px rgba(17, 153, 142, 0.3);
}

.clear-button {
  background: rgba(236, 240, 241, 0.8);
  color: #7f8c8d;
}

.clear-button:hover {
  background: rgba(236, 240, 241, 1);
  transform: translateY(-3px);
}

.glow-on-hover {
  position: relative;
  z-index: 1;
}

.glow-on-hover::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
  z-index: -1;
  filter: blur(5px);
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 10px;
  animation: glowing 20s linear infinite;
}

.glow-on-hover:hover::before {
  opacity: 1;
}

@keyframes glowing {
  0% { background-position: 0 0; }
  50% { background-position: 400% 0; }
  100% { background-position: 0 0; }
}

/* Filter section */
.filter-section {
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  color: #6a11cb;
}

.search-box input {
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}

.search-box input:focus {
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-dropdown {
  flex-grow: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.filter-dropdown i {
  position: absolute;
  left: 15px;
  color: #6a11cb;
  z-index: 2;
}

.filter-dropdown select {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-dropdown::after {
  content: '\25BC';
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6a11cb;
  pointer-events: none;
  font-size: 12px;
}

.sort-button {
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  padding: 8px 15px;
  min-width: 100px;
}

/* View toggle */
.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: flex-end;
}

.view-toggle button {
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
}

.view-toggle button.active {
  background: #6a11cb;
  color: white;
}

/* Items container */
.items-container {
  min-height: 200px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #6a11cb;
  animation: spin 1s linear infinite;
  position: relative;
}

.spinner::before, 
.spinner::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
}

.spinner::before {
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-top-color: #2575fc;
  animation: spin 1.5s linear infinite;
}

.spinner::after {
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border-top-color: #8e2de2;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-list {
  text-align: center;
  padding: 50px 0;
  color: #7f8c8d;
}

.empty-animation {
  position: relative;
  margin-bottom: 30px;
}

.empty-animation i {
  font-size: 80px;
  color: #6a11cb;
  opacity: 0.7;
  animation: float-icon 3s ease infinite;
}

@keyframes float-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.empty-list p {
  font-size: 18px;
  margin-bottom: 15px;
}

.add-first-item {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
  padding: 12px 25px;
  margin: 20px auto 0;
  border-radius: 25px;
}

.pulse-button {
  animation: pulse 2s infinite;
}

/* Items list */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.shopping-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 5px solid #6a11cb;
  position: relative;
  overflow: hidden;
}

.grid-item {
  flex-direction: column;
  text-align: center;
  border-left: none;
  border-top: 5px solid #6a11cb;
}

.grid-item .item-category-icon {
  margin-bottom: 15px;
}

.grid-item .item-details {
  width: 100%;
  text-align: center;
  margin: 10px 0;
}

.grid-item .item-actions {
  width: 100%;
  justify-content: center;
  margin-top: 15px;
}

.shopping-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(106, 17, 203, 0.1), rgba(37, 117, 252, 0.1));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.shopping-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.shopping-item:hover::before {
  opacity: 1;
}

.shopping-item.purchased {
  border-left-color: #2ecc71;
  background: rgba(46, 204, 113, 0.1);
}

.grid-item.purchased {
  border-top-color: #2ecc71;
}

.shopping-item.expiring-soon {
  border-left-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
}

.grid-item.expiring-soon {
  border-top-color: #f39c12;
}

.shopping-item.expired {
  border-left-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.grid-item.expired {
  border-top-color: #e74c3c;
}

.item-category-icon {
  flex: 0 0 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(106, 17, 203, 0.1);
  margin-right: 15px;
}

.item-category-icon i {
  color: #6a11cb;
  font-size: 24px;
}

.item-status {
  margin-right: 15px;
}

.item-details {
  flex: 1;
  cursor: pointer;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #34495e;
}

.shopping-item.purchased .item-name {
  text-decoration: line-through;
  color: #7f8c8d;
}

.item-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quantity {
  background: linear-gradient(45deg, #f1c40f, #f39c12);
  color: white;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.category {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.expiry-date {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 12px;
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.expiry-date.expired {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  font-weight: 600;
}

.expiry-date.expiring-soon {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.action-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button {
  background: linear-gradient(45deg, #f39c12, #f1c40f);
  color: white;
}

.delete-button {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.action-button:hover {
  transform: scale(1.1);
}

/* Fancy checkbox */
.fancy-checkbox {
  display: block;
  position: relative;
  cursor: pointer;
  font-size: 22px;
  user-select: none;
  width: 30px;
  height: 30px;
}

.fancy-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 30px;
  width: 30px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 2px solid rgba(106, 17, 203, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fancy-checkbox:hover input ~ .checkmark {
  background-color: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

.fancy-checkbox input:checked ~ .checkmark {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  border-color: transparent;
}

.check-icon {
  color: white;
  font-size: 18px;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.fancy-checkbox input:checked ~ .checkmark .check-icon {
  opacity: 1;
  transform: scale(1);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(106, 17, 203, 0.2);
  padding-bottom: 15px;
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6a11cb;
}

.close-button {
  background: transparent;
  color: #95a5a6;
  padding: 5px;
}

.close-button:hover {
  color: #e74c3c;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.cancel-button {
  background: #ecf0f1;
  color: #7f8c8d;
}

.save-button {
  background: linear-gradient(45deg, #11998e, #38ef7d);
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Toast notifications */
.toast-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
}

.toast {
  padding: 15px 20px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: slideInRight 0.5s ease-out;
}

.toast.success {
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.95), rgba(56, 239, 125, 0.95));
  color: white;
}

.toast.error {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95));
  color: white;
}

.toast.warning {
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.95), rgba(241, 196, 15, 0.95));
  color: white;
}

.toast.info {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(41, 128, 185, 0.95));
  color: white;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Transition animations */
.toast-enter-active, 
.toast-leave-active {
  transition: all 0.5s;
}

.toast-enter-from, 
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.item-list-enter-active,
.item-list-leave-active {
  transition: all 0.5s ease;
}

.item-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.item-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Confetti animation */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
}

.confetti {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background-color: var(--bg-color);
  top: -10px;
  left: var(--left-pos);
  opacity: 0.7;
  transform: rotate(var(--rotation));
  animation: fall var(--fall-duration) var(--fall-delay) linear infinite;
}

@keyframes fall {
  0% {
    top: -10px;
    transform: translateX(0) rotate(0deg);
    opacity: 0.7;
  }
  10% {
    transform: translateX(-20px) rotate(45deg);
  }
  20% {
    transform: translateX(20px) rotate(90deg);
  }
  30% {
    transform: translateX(-20px) rotate(135deg);
  }
  40% {
    transform: translateX(20px) rotate(180deg);
  }
  50% {
    transform: translateX(-20px) rotate(225deg);
  }
  60% {
    transform: translateX(20px) rotate(270deg);
  }
  70% {
    transform: translateX(-20px) rotate(315deg);
  }
  80% {
    transform: translateX(20px) rotate(360deg);
  }
  100% {
    top: 110%;
    transform: translateX(-20px) rotate(400deg);
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .shopping-list-container {
    padding: 10px;
  }
  
  .glass-panel {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .title-icon {
    font-size: 2rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .grid-view {
    grid-template-columns: 1fr;
  }
  
  .toast-container {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .shopping-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-left: none;
    border-top: 5px solid #6a11cb;
    padding: 15px;
  }
  
  .shopping-item.purchased {
    border-top-color: #2ecc71;
    border-left: none;
  }
  
  .shopping-item.expiring-soon {
    border-top-color: #f39c12;
    border-left: none;
  }
  
  .shopping-item.expired {
    border-top-color: #e74c3c;
    border-left: none;
  }
  
  .item-category-icon {
    margin: 0 0 10px 0;
  }
  
  .item-status {
    margin: 0 0 10px 0;
  }
  
  .item-details {
    width: 100%;
    text-align: center;
    margin: 10px 0;
  }
  
  .item-actions {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
}
</style>