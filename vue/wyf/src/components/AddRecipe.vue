<template>
  <div class="recipe-form-container">
    <v-card class="recipe-form-card">
      <v-card-title class="form-header">
        {{ isEditing ? 'Modifica ricetta' : 'Aggiungi una nuova ricetta' }}
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="saveRecipe">
          <!-- Upload image section -->
          <div class="image-upload-section">
            <div class="preview-container" @click="triggerImageUpload" :class="{ 'has-image': recipe.image }">
              <img v-if="recipe.image" :src="recipe.image" class="preview-image" alt="Preview" />
              <div v-else class="upload-placeholder">
                <v-icon size="48">mdi-camera</v-icon>
                <div>Aggiungi immagine</div>
              </div>
            </div>
            <input 
              type="file" 
              ref="imageInput" 
              @change="onImageSelected" 
              accept="image/*" 
              style="display: none"
            />
          </div>
          
          <v-text-field
            v-model="recipe.title"
            label="Titolo della ricetta*"
            :rules="[v => !!v || 'Il titolo è obbligatorio']"
            outlined
            dense
            class="form-field"
          ></v-text-field>
          
          <div class="difficulty-type-row">
            <v-select
              v-model="recipe.difficulty"
              :items="difficultyLevels"
              label="Difficoltà"
              outlined
              dense
              class="difficulty-select"
            ></v-select>
            
            <v-select
              v-model="recipe.type"
              :items="cuisineTypes"
              label="Tipo di cucina"
              outlined
              dense
              class="type-select"
            ></v-select>
          </div>
          
          <v-textarea
            v-model="recipe.description"
            label="Descrizione*"
            :rules="[v => !!v || 'La descrizione è obbligatoria']"
            outlined
            auto-grow
            rows="2"
            class="form-field"
          ></v-textarea>
          
          <!-- Essential ingredients section -->
          <div class="ingredients-section">
            <div class="section-title">
              <h3>Ingredienti essenziali*</h3>
              <v-btn small text color="primary" @click="addIngredient('essential')">
                <v-icon small left>mdi-plus</v-icon> Aggiungi
              </v-btn>
            </div>
            
            <v-slide-y-transition group>
              <div v-for="(ingredient, index) in recipe.essential_ingredients" :key="`essential-${index}`" class="ingredient-item">
                <v-text-field
                  v-model="recipe.essential_ingredients[index]"
                  label="Ingrediente"
                  outlined
                  dense
                  hide-details
                ></v-text-field>
                <v-btn icon small @click="removeIngredient('essential', index)">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-slide-y-transition>
          </div>
          
          <!-- Additional ingredients section -->
          <div class="ingredients-section">
            <div class="section-title">
              <h3>Ingredienti aggiuntivi</h3>
              <v-btn small text color="primary" @click="addIngredient('additional')">
                <v-icon small left>mdi-plus</v-icon> Aggiungi
              </v-btn>
            </div>
            
            <v-slide-y-transition group>
              <div v-for="(ingredient, index) in recipe.additional_ingredients" :key="`additional-${index}`" class="ingredient-item">
                <v-text-field
                  v-model="recipe.additional_ingredients[index]"
                  label="Ingrediente"
                  outlined
                  dense
                  hide-details
                ></v-text-field>
                <v-btn icon small @click="removeIngredient('additional', index)">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-slide-y-transition>
          </div>
          
          <!-- Instructions section -->
          <v-textarea
            v-model="recipe.instructions"
            label="Istruzioni*"
            :rules="[v => !!v || 'Le istruzioni sono obbligatorie']"
            outlined
            auto-grow
            rows="4"
            class="form-field"
          ></v-textarea>
          
          <div class="form-actions">
            <v-btn 
              color="primary" 
              block 
              large 
              :disabled="!valid" 
              :loading="loading"
              type="submit"
              class="save-button"
            >
              {{ isEditing ? 'Aggiorna ricetta' : 'Salva ricetta' }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'AddRecipe',
  props: {
    editRecipe: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      recipe: {
        title: '',
        image: null,
        difficulty: 'facile',
        type: 'Italian',
        description: '',
        essential_ingredients: [''],
        additional_ingredients: [],
        instructions: ''
      },
      difficultyLevels: ['facile', 'media', 'difficile'],
      cuisineTypes: [
        'Italian', 
        'French', 
        'Chinese', 
        'Japanese', 
        'Indian', 
        'Mexican', 
        'Spanish',
        'Greek',
        'Thai',
        'American',
        'Other'
      ]
    };
  },
  computed: {
    isEditing() {
      return !!this.editRecipe;
    }
  },
  watch: {
    editRecipe: {
      immediate: true,
      handler(recipe) {
        if (recipe) {
          this.recipe = { ...recipe };
        }
      }
    }
  },
  methods: {
    triggerImageUpload() {
      this.$refs.imageInput.click();
    },
    onImageSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('L\'immagine non deve superare i 2MB');
        return;
      }
      
      // Optimize the image before uploading
      this.optimizeImage(file);
    },
    
    optimizeImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for image compression
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions (max width/height of 800px)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas with new dimensions
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as data URL
          const quality = 0.7; // 70% quality, adjust as needed
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Set the compressed image
          this.recipe.image = dataUrl;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    addIngredient(type) {
      if (type === 'essential') {
        this.recipe.essential_ingredients.push('');
      } else {
        this.recipe.additional_ingredients.push('');
      }
    },
    removeIngredient(type, index) {
      if (type === 'essential' && this.recipe.essential_ingredients.length > 1) {
        this.recipe.essential_ingredients.splice(index, 1);
      } else if (type === 'additional') {
        this.recipe.additional_ingredients.splice(index, 1);
      }
    },
    async saveRecipe() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        // Filter out empty ingredients
        const essential = this.recipe.essential_ingredients.filter(item => item.trim() !== '');
        const additional = this.recipe.additional_ingredients.filter(item => item.trim() !== '');
        
        const recipeData = {
          title: this.recipe.title,
          image: this.recipe.image,
          difficulty: this.recipe.difficulty,
          type: this.recipe.type,
          description: this.recipe.description,
          essential_ingredients: essential,
          additional_ingredients: additional,
          instructions: this.recipe.instructions
        };
        
        let response;
        
        if (this.isEditing) {
          // Update existing recipe
          response = await fetch(`http://localhost:3000/user-recipes/${this.recipe.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
          });
        } else {
          // Create new recipe
          response = await fetch('http://localhost:3000/user-recipes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
          });
        }
        
        if (!response.ok) {
          throw new Error('Errore durante il salvataggio della ricetta');
        }
        
        const result = await response.json();
        this.$emit('saved', this.isEditing ? this.recipe.id : result.recipeId);
        
      } catch (error) {
        console.error('Error saving recipe:', error);
        // You could add a notification system here
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.recipe-form-container {
  max-width: 100%;
  margin: 0 auto;
}

.recipe-form-card {
  border-radius: 12px;
  overflow: hidden;
}

.form-header {
  background-color: #f8f8f8;
  padding: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.form-field {
  margin-bottom: 16px;
}

.difficulty-type-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.difficulty-select, .type-select {
  flex: 1;
}

.ingredients-section {
  margin-bottom: 20px;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
}

.ingredient-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.ingredient-item .v-text-field {
  flex: 1;
  margin-right: 8px;
}

.image-upload-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.preview-container {
  width: 200px;
  height: 200px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-container:hover {
  border-color: #4caf50;
  background-color: #f9f9f9;
}

.preview-container.has-image {
  border-style: solid;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
}

.form-actions {
  margin-top: 24px;
}

.save-button {
  height: 48px !important;
  font-size: 1.1rem !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

@media (max-width: 600px) {
  .form-header {
    padding: 12px;
    font-size: 1.2rem;
  }
  
  .image-upload-section {
    margin-bottom: 16px;
  }
  
  .preview-container {
    width: 150px;
    height: 150px;
  }
  
  .difficulty-type-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .ingredients-section {
    padding: 12px;
  }
  
  .section-title {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-title h3 {
    margin-bottom: 8px;
  }
  
  .save-button {
    height: 44px !important;
    font-size: 1rem !important;
  }
}
</style>