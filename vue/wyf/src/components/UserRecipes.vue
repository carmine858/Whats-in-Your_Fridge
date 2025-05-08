<template>
  <div class="recipes-container">
    <transition name="fade">
      <div v-if="loading" class="loading-container">
        <v-progress-circular indeterminate color="primary" size="70"></v-progress-circular>
        <p>Caricamento ricette...</p>
      </div>
      
      <div v-else>
        <div class="recipes-header">
          <h2 class="recipes-title">Le tue ricette</h2>
          <v-btn color="primary" @click="addNewRecipe" class="add-button">
            <v-icon left>mdi-plus</v-icon>
            Aggiungi ricetta
          </v-btn>
        </div>

        <div v-if="recipes.length === 0" class="empty-state">
          <v-img src="https://cdn-icons-png.flaticon.com/512/1830/1830839.png" max-width="120" class="empty-icon"></v-img>
          <h3>Non hai ancora aggiunto ricette</h3>
          <p>Condividi le tue creazioni culinarie con la community!</p>
          <v-btn color="primary" @click="addNewRecipe" class="mt-4">
            <v-icon left>mdi-plus</v-icon>
            Crea la tua prima ricetta
          </v-btn>
        </div>

        <div v-else class="recipe-grid">
          <div v-for="recipe in recipes" :key="recipe.id" class="recipe-col">
            <v-card class="recipe-card" elevation="2" hover>
              <div class="recipe-image-container">
                <v-img 
                  :src="recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'" 
                  class="recipe-image"
                  height="200"
                  :aspect-ratio="16/9"
                  cover
                >
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <div class="recipe-actions">
                  <v-btn icon small color="white" @click.stop="editRecipe(recipe)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon small color="white" @click.stop="confirmDeleteRecipe(recipe)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
                <div class="recipe-difficulty" :class="difficultyClass(recipe.difficulty)">
                  {{ recipe.difficulty }}
                </div>
              </div>
              <v-card-title class="recipe-title">
                {{ recipe.title }}
              </v-card-title>
              <v-card-subtitle class="recipe-type">
                {{ recipe.type || 'Tipo non specificato' }}
              </v-card-subtitle>
              <v-card-text class="recipe-description">
                {{ recipe.description }}
              </v-card-text>
              <v-card-actions>
                <v-btn text color="primary" @click="viewRecipeDetails(recipe)">
                  Vedi dettagli
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </div>

        <!-- Add/Edit Recipe Dialog -->
        <v-dialog 
          v-model="recipeDialog" 
          fullscreen 
          transition="dialog-bottom-transition"
          content-class="recipe-dialog-container"
        >
          <v-card class="recipe-form-card">
            <v-toolbar dark color="primary" class="recipe-form-header">
              <v-btn icon dark @click="closeRecipeDialog">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title>{{ selectedRecipe ? 'Modifica Ricetta' : 'Nuova Ricetta' }}</v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            
            <v-card-text class="recipe-form-content">
              <add-recipe 
                :edit-recipe="selectedRecipe" 
                @close="closeRecipeDialog" 
                @saved="onRecipeSaved"
              ></add-recipe>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Recipe Details Dialog -->
        <v-dialog v-model="detailsDialog" max-width="700">
          <v-card v-if="selectedRecipe" class="details-card">
            <v-img 
              :src="selectedRecipe.image || 'https://via.placeholder.com/600x300?text=No+Image'" 
              max-height="300"
              :aspect-ratio="16/9"
              class="details-image"
            ></v-img>
            <v-card-title class="details-title">{{ selectedRecipe.title }}</v-card-title>
            <v-card-subtitle>
              <v-chip small :color="difficultyColor(selectedRecipe.difficulty)" text-color="white" class="mr-2">
                {{ selectedRecipe.difficulty }}
              </v-chip>
              <v-chip small color="secondary" text-color="white">
                {{ selectedRecipe.type || 'Tipo non specificato' }}
              </v-chip>
            </v-card-subtitle>
            
            <v-card-text>
              <div class="details-description">{{ selectedRecipe.description }}</div>
              
              <div class="details-section">
                <h3 class="details-section-title">Ingredienti essenziali</h3>
                <ul class="ingredients-list">
                  <li v-for="(ingredient, i) in selectedRecipe.essential_ingredients" :key="i">
                    {{ ingredient }}
                  </li>
                </ul>
              </div>
              
              <div v-if="selectedRecipe.additional_ingredients && selectedRecipe.additional_ingredients.length > 0" class="details-section">
                <h3 class="details-section-title">Ingredienti aggiuntivi</h3>
                <ul class="ingredients-list">
                  <li v-for="(ingredient, i) in selectedRecipe.additional_ingredients" :key="i">
                    {{ ingredient }}
                  </li>
                </ul>
              </div>
              
              <div class="details-section">
                <h3 class="details-section-title">Istruzioni</h3>
                <p class="instructions-text">{{ selectedRecipe.instructions }}</p>
              </div>
            </v-card-text>
            
            <v-card-actions class="details-actions">
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="editRecipe(selectedRecipe)">
                <v-icon left>mdi-pencil</v-icon>
                Modifica
              </v-btn>
              <v-btn text @click="detailsDialog = false">
                Chiudi
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Conferma eliminazione</v-card-title>
            <v-card-text>
              Sei sicuro di voler eliminare la ricetta "{{ selectedRecipe ? selectedRecipe.title : '' }}"? Quest'azione non può essere annullata.
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="deleteDialog = false">Annulla</v-btn>
              <v-btn color="error" text @click="deleteRecipe" :loading="deletingRecipe">Elimina</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </transition>
  </div>
</template>

<script>
import AddRecipe from '@/components/AddRecipe.vue';

export default {
  name: 'UserRecipes',
  components: {
    AddRecipe
  },
  data() {
    return {
      recipes: [],
      loading: true,
      recipeDialog: false,
      detailsDialog: false,
      deleteDialog: false,
      selectedRecipe: null,
      deletingRecipe: false
    };
  },
  mounted() {
    this.fetchRecipes();
  },
  methods: {
    async fetchRecipes() {
      this.loading = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const response = await fetch('http://localhost:3000/user-recipes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        this.recipes = data.recipes || [];
      } catch (error) {
        console.error('Error fetching recipes:', error);
        // You could add notification system here
      } finally {
        this.loading = false;
      }
    },
    difficultyClass(difficulty) {
      switch(difficulty?.toLowerCase()) {
        case 'facile': return 'easy';
        case 'media': return 'medium';
        case 'difficile': return 'hard';
        default: return 'medium';
      }
    },
    difficultyColor(difficulty) {
      switch(difficulty?.toLowerCase()) {
        case 'facile': return 'green';
        case 'media': return 'orange';
        case 'difficile': return 'red';
        default: return 'grey';
      }
    },
    addNewRecipe() {
      this.selectedRecipe = null;
      this.recipeDialog = true;
    },
    editRecipe(recipe) {
      this.selectedRecipe = recipe;
      this.recipeDialog = true;
      this.detailsDialog = false;
    },
    closeRecipeDialog() {
      this.recipeDialog = false;
      this.selectedRecipe = null;
    },
    viewRecipeDetails(recipe) {
      this.selectedRecipe = recipe;
      this.detailsDialog = true;
    },
    confirmDeleteRecipe(recipe) {
      this.selectedRecipe = recipe;
      this.deleteDialog = true;
    },
    async deleteRecipe() {
      if (!this.selectedRecipe) return;
      
      this.deletingRecipe = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const response = await fetch(`http://localhost:3000/user-recipes/${this.selectedRecipe.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete recipe');
        }
        
        // Remove the recipe from the list
        this.recipes = this.recipes.filter(recipe => recipe.id !== this.selectedRecipe.id);
        this.deleteDialog = false;
        this.selectedRecipe = null;
        
      } catch (error) {
        console.error('Error deleting recipe:', error);
        // You could add notification system here
      } finally {
        this.deletingRecipe = false;
      }
    },
    async onRecipeSaved() {
      // Close dialog
      this.recipeDialog = false;
      
      // Refresh recipes list
      await this.fetchRecipes();
    }
  }
};
</script>

<style scoped>
.recipes-container {
  position: relative;
  padding: 24px;
  background-color: #f8fafc;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, #f9fafb 0%, #f0f4f8 100%);
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.03);
}

.loading-container p {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.5px;
}

.recipes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
}

.recipes-header::after {
  content: "";
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #6366F1, #4F46E5);
  border-radius: 3px;
}

.recipes-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.add-button {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
  border-radius: 12px !important;
  padding: 0 20px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
  height: 44px !important;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(99, 102, 241, 0.3) !important;
}

.recipe-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 0;
}

.recipe-col {
  flex: 0 0 calc(33.333% - 16px);
  display: flex;
  min-width: 280px;
}

@media (max-width: 1200px) {
  .recipe-col {
    flex: 0 0 calc(50% - 12px);
  }
}

@media (max-width: 768px) {
  .recipe-col {
    flex: 0 0 100%;
  }
}

.recipe-card {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06) !important;
  position: relative;
  background: white;
}

.recipe-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
}

.recipe-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #6366F1, #4F46E5);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.recipe-card:hover::after {
  transform: scaleX(1);
}

.recipe-image-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.recipe-image {
  transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  width: 100%;
  object-fit: cover;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.08);
}

.recipe-image::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%);
}

.recipe-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: 2;
}

.recipe-card:hover .recipe-actions {
  opacity: 1;
  transform: translateY(0);
}

.recipe-actions .v-btn {
  background: rgba(255, 255, 255, 0.95);
  margin-left: 8px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  width: 36px !important;
  height: 36px !important;
  transition: all 0.3s ease;
}

.recipe-actions .v-btn:first-child:hover {
  background: #4F46E5 !important;
  color: white !important;
}

.recipe-actions .v-btn:last-child:hover {
  background: #ef4444 !important;
  color: white !important;
}

.recipe-difficulty {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 4px 12px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 20px;
  letter-spacing: 1px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  backdrop-filter: blur(5px);
  z-index: 2;
}

.recipe-difficulty.easy {
  background-color: rgba(34, 197, 94, 0.9);
}

.recipe-difficulty.medium {
  background-color: rgba(249, 115, 22, 0.9);
}

.recipe-difficulty.hard {
  background-color: rgba(239, 68, 68, 0.9);
}

.recipe-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  padding: 16px 16px 4px;
  color: #334155;
}

.recipe-type {
  color: #64748b;
  font-size: 0.9rem;
  padding: 0 16px 8px;
  font-weight: 500;
}

.recipe-description {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  padding: 0 16px 16px;
}

.v-card-actions {
  padding: 8px 8px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.v-card-actions .v-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #4F46E5 !important;
  padding-left: 0 !important;
  transition: all 0.3s ease;
}

.v-card-actions .v-btn:hover {
  color: #4338CA !important;
  transform: translateX(4px);
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #f0f4f8 100%);
  border-radius: 24px;
  margin: 20px 0;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.03);
}

.empty-icon {
  margin: 0 auto 30px;
  opacity: 0.7;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.empty-state:hover .empty-icon {
  transform: translateY(-10px);
}

.empty-state h3 {
  margin-bottom: 12px;
  color: #334155;
  font-size: 24px;
  font-weight: 700;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 30px;
  font-size: 16px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-state .v-btn {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
  border-radius: 12px !important;
  padding: 0 24px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 6px 15px rgba(99, 102, 241, 0.25) !important;
  transition: all 0.3s ease !important;
  height: 48px !important;
}

.empty-state .v-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35) !important;
}

.details-card {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
  background: white;
}

.details-image {
  height: 300px;
  position: relative;
}

.details-image::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%);
}

.details-title {
  font-size: 2rem;
  font-weight: 800;
  padding: 24px 24px 8px;
  color: #1e293b;
}

.details-description {
  margin: 24px 0;
  color: #475569;
  line-height: 1.7;
  font-size: 15px;
  padding: 0 4px;
}

.details-section {
  margin: 32px 0;
  padding: 0 4px;
}

.details-section-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #334155;
  display: flex;
  align-items: center;
}

.details-section-title::before {
  content: "";
  display: block;
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, #6366F1, #4F46E5);
  margin-right: 10px;
  border-radius: 4px;
}

.ingredients-list {
  list-style-type: none;
  padding-left: 0;
  color: #475569;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-gap: 12px;
}

.ingredients-list li {
  position: relative;
  padding: 8px 8px 8px 28px;
  background-color: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  border-left: 3px solid #6366F1;
}

.ingredients-list li:hover {
  background-color: #f1f5f9;
  transform: translateX(3px);
}

.ingredients-list li::before {
  content: "●";
  position: absolute;
  left: 10px;
  color: #6366F1;
  font-size: 12px;
}

.instructions-text {
  white-space: pre-line;
  line-height: 1.8;
  color: #475569;
  font-size: 15px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 12px;
}

.details-actions {
  padding: 16px 24px 24px;
  background-color: #f8fafc;
}

/* Recipe Form Dialog Styles */
.recipe-dialog-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.recipe-form-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 0;
  background-color: #f8fafc;
}

.recipe-form-header {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recipe-form-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  height: calc(100vh - 64px);
  scroll-behavior: smooth;
  background-color: #f8fafc;
}

.recipe-form-content::-webkit-scrollbar {
  width: 8px;
}

.recipe-form-content::-webkit-scrollbar-track {
  background-color: #f1f5f9;
  border-radius: 4px;
}

.recipe-form-content::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

.recipe-form-content::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .recipes-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .recipes-title {
    margin-bottom: 20px;
    font-size: 1.8rem;
  }
  
  .add-button {
    align-self: stretch;
    margin-top: 8px;
  }
  
  .recipe-form-content {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .recipes-container {
    padding: 16px;
  }
  
  .recipes-title {
    font-size: 1.6rem;
  }
  
  .recipe-title {
    font-size: 1.1rem;
  }
  
  .recipe-type {
    font-size: 0.85rem;
  }
  
  .empty-state {
    padding: 50px 20px;
    border-radius: 16px;
  }
  
  .empty-state h3 {
    font-size: 20px;
  }
  
  .details-card .details-title {
    font-size: 1.5rem;
    padding: 20px 16px 4px;
  }
  
  .ingredients-list {
    grid-template-columns: 1fr;
  }
  
  .details-section-title {
    font-size: 1.2rem;
  }
  
  .recipe-form-content {
    padding: 12px;
  }
}
</style>