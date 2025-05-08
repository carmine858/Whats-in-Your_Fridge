<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="welcome-title">Welcome <span class="user-name">{{ userName }}</span>!</h1>
        <p class="welcome-subtitle">What would you like to cook today?</p>
        <div class="search-wrapper">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search recipes by ingredients or name"
            single-line
            hide-details
            class="search-input"
            @keyup.enter="onSearchChange"
            variant="outlined"
            density="comfortable"
            bg-color="white"
          ></v-text-field>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="categories-section">
      <div class="container">
        <div class="section-header">
          <h2>Categories</h2>
          <span class="section-divider"></span>
        </div>
        <div class="categories-wrapper">
          <v-chip-group
            v-model="selectedCategory"
            selected-class="category-active"
            @update:model-value="filterByCategory"
          >
            <v-chip
              v-for="category in categories"
              :key="category.id"
              class="category-chip"
              :value="category.id"
              :prepend-icon="category.icon"
              filter
              variant="elevated"
            >
              {{ category.name }}
            </v-chip>
          </v-chip-group>
        </div>
      </div>
    </section>

    <!-- Recipes Section -->
    <section class="recipes-section">
      <div class="container">
        <div class="section-header">
          <h2>Recipes for You</h2>
          <span class="section-divider"></span>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="recipes-loader">
          <div class="loader-wrapper">
            <v-progress-circular
              indeterminate
              color="primary"
              size="70"
            ></v-progress-circular>
            <p>Finding the perfect recipes...</p>
          </div>
        </div>
        
        <!-- No Recipes State -->
        <div v-else-if="filteredRecipes.length === 0" class="no-recipes">
          <v-icon icon="mdi-food-off" size="64" color="grey-lighten-1"></v-icon>
          <h3>No recipes found</h3>
          <p>Try adjusting your search or category filters to find more recipes.</p>
          <v-btn
            prepend-icon="mdi-refresh"
            color="primary"
            @click="resetFilters"
            variant="outlined"
          >
            Reset Filters
          </v-btn>
        </div>
        
        <!-- Recipes Grid -->
        <v-row v-else class="recipes-grid">
          <v-col
            v-for="(recipe, index) in filteredRecipes"
            :key="recipe.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="recipe-card recipe-card-animated"
              :style="{ 'animation-delay': `${index * 0.05}s` }"
              @click="viewRecipeDetails(recipe.id)"
            >
              <div class="recipe-image">
                <v-img
                  :src="recipe.image || require('../assets/logo.png')"
                  height="180"
                  cover
                >
                  <div class="category-badge">
                    {{ getCategoryName(recipe.categoryId) }}
                  </div>
                  
                  <div :class="['difficulty-badge', `difficulty-${recipe.difficulty ? recipe.difficulty.toLowerCase() : 'facile'}`]">
                    <v-icon size="small" class="mr-1">
                      {{ getDifficultyIcon(recipe.difficulty || 'facile') }}
                    </v-icon>
                    {{ recipe.difficulty || 'facile' }}
                  </div>
                  
                  <div class="recipe-overlay">
                    <span class="recipe-time">
                      <v-icon size="small">mdi-clock-outline</v-icon>
                      {{ recipe.cookingTime }} min
                    </span>
                    
                    <span class="recipe-rating">
                      <v-icon size="small" color="amber">mdi-star</v-icon>
                      <span class="rating-value">{{ (recipe.rating || 0).toFixed(1) }}</span>
                    </span>
                  </div>
                </v-img>
              </div>
              
              <v-card-title class="recipe-title">
                {{ recipe.name }}
              </v-card-title>
              
              <v-card-text class="recipe-meta">
                <div class="ingredient-tags">
                  <v-chip
                    v-for="(ingredient, i) in recipe.ingredients.slice(0, 3)"
                    :key="i"
                    size="x-small"
                    class="mr-1 mb-1 ingredient-chip"
                    color="secondary"
                    variant="outlined"
                  >
                    {{ ingredient }}
                  </v-chip>
                  <v-chip
                    v-if="recipe.ingredients.length > 3"
                    size="x-small"
                    class="mb-1 ingredient-chip"
                    color="grey"
                    variant="flat"
                  >
                    +{{ recipe.ingredients.length - 3 }}
                  </v-chip>
                </div>
                <p class="recipe-description">{{ truncateText(recipe.description, 100) }}</p>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions class="recipe-actions">
                <v-btn
                  variant="text"
                  class="action-btn"
                  color="primary"
                  @click.stop="addToFavorites(recipe.id)"
                >
                  <v-icon>{{ isInFavorites(recipe.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  class="action-btn"
                  color="primary"
                  @click.stop="addToShoppingList(recipe.id)"
                >
                  <v-icon>mdi-cart-outline</v-icon>
                </v-btn>
                <v-btn
                  variant="text"
                  class="action-btn"
                  color="primary"
                  @click.stop="shareRecipe(recipe.id)"
                >
                  <v-icon>mdi-share-variant</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </section>

    <!-- AI Chef Promo Section -->
    <section class="container">
      <div class="promo-section">
        <div class="promo-content">
          <h2>Need Cooking Advice?</h2>
          <p>Chat with our AI Chef and get personalized recipe suggestions based on ingredients you have at home.</p>
          <v-btn
            class="promo-btn"
            color="white"
            variant="elevated"
            size="large"
            :to="{ name: 'chat' }"
            prepend-icon="mdi-robot"
          >
            Chat with AI Chef
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Suggestions Section -->
    <section class="suggestions-section">
      <div class="container">
        <div class="section-header">
          <h2>You Might Also Like</h2>
          <span class="section-divider"></span>
        </div>
        <div class="suggestions-scroll-container">
          <v-btn
            v-if="suggestionRecipes.length > 3"
            size="small"
            icon="mdi-chevron-left"
            class="scroll-arrow scroll-left"
            @click="scrollSuggestions('left')"
          ></v-btn>
          
          <div class="suggestions-cards" ref="suggestionsContainer">
            <v-card
              v-for="recipe in suggestionRecipes"
              :key="`suggestion-${recipe.id}`"
              class="suggestion-card"
              @click="viewRecipeDetails(recipe.id)"
            >
              <v-img
                :src="recipe.image || require('../assets/logo.png')"
                height="120"
                cover
              ></v-img>
              <div class="suggestion-title">{{ recipe.name }}</div>
              <div class="suggestion-cuisine">{{ getCategoryName(recipe.categoryId) }}</div>
            </v-card>
          </div>
          
          <v-btn
            v-if="suggestionRecipes.length > 3"
            size="small"
            icon="mdi-chevron-right"
            class="scroll-arrow scroll-right"
            @click="scrollSuggestions('right')"
          ></v-btn>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import { debounce } from 'lodash';

export default {
  data() {
    return {
      recipes: [],
      search: "",
      searchSuggestions: [],
      loadingSuggestions: false,
      selectedCategory: "All",
      selectedCategoryIndex: 0,
      categories: [
        { id: "All", name: "All", icon: "mdi-silverware-fork-knife" },
        { id: "Italian", name: "Italian", icon: "mdi-pasta" },
        { id: "Indian", name: "Indian", icon: "mdi-food-indian" },
        { id: "Asian", name: "Asian", icon: "mdi-rice" },
        { id: "Chinese", name: "Chinese", icon: "mdi-noodles" },
        { id: "Mexican", name: "Mexican", icon: "mdi-taco" },
        { id: "American", name: "American", icon: "mdi-hamburger" }
      ],
      loading: false,
      defaultImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      fallbackImages: {
        "Italian": "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "Indian": "https://images.unsplash.com/photo-1585937421612-70a008356cf4?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "Asian": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "Chinese": "https://images.unsplash.com/photo-1525755662778-989d0524087e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "Mexican": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "American": "https://images.unsplash.com/photo-1550547660-d9450f859349?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "Other": "https://images.unsplash.com/photo-1495521821757-a1efb6729352?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
      },
      username: "Cuoco",
      favorites: []
    };
  },
  computed: {
    // Compute user's name for display
    userName() {
      return this.username || "Guest";
    },
    
    // Filtered recipes based on search and category
    filteredRecipes() {
      return this.recipes;
    },
    
    // Suggestions for "You might also like" section
    suggestionRecipes() {
      // If no recipes, return an empty array
      if (this.recipes.length === 0) return [];
      
      // Otherwise, shuffle recipes and take 5 random ones
      // In a real version, more sophisticated logic would be implemented
      const shuffled = [...this.recipes];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled.slice(0, 5);
    }
  },
  created() {
    // Create a debounced version of the search function
    this.debouncedFetchSuggestions = debounce(this.fetchSuggestions, 300);
  },
  methods: {
    // Truncate text to a specific length
    truncateText(text, length) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    
    // Return the appropriate icon for a category
    getCategoryIcon(category) {
      const icons = {
        "All": "mdi-silverware-fork-knife",
        "Italian": "mdi-pasta",
        "Indian": "mdi-food-indian",
        "Chinese": "mdi-noodles",
        "Asian": "mdi-rice",
        "Mexican": "mdi-taco",
        "American": "mdi-hamburger"
      };
      return icons[category] || "mdi-food";
    },
    
    // Get the category name by ID
    getCategoryName(categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId);
      return category ? category.name : "Other";
    },
    
    // Return the icon based on difficulty
    getDifficultyIcon(difficulty) {
      const icons = {
        "facile": "mdi-emoticon",
        "media": "mdi-emoticon-neutral",
        "difficile": "mdi-emoticon-cool"
      };
      return icons[difficulty?.toLowerCase()] || "mdi-chef-hat";
    },
    
    // Convert rating to a numeric value for the v-rating component
    getRatingValue(rating) {
      if (!rating) return 0;
      const numRating = parseFloat(rating);
      return isNaN(numRating) ? 0 : Math.min(5, Math.max(0, numRating));
    },
    
    // Determine the recipe section title based on applied filters
    getRecipesSectionTitle() {
      if (this.search) {
        return `Recipes for "${this.search}"`;
      } else if (this.selectedCategory !== "All") {
        return `${this.selectedCategory} Recipes`;
      } else {
        return "Popular Recipes";
      }
    },
    
    // Reset all filters
    resetFilters() {
      this.search = "";
      this.selectedCategory = "All";
      this.selectedCategoryIndex = 0;
      this.fetchRecipes();
    },
    
    // Horizontal scroll for suggestions
    scrollSuggestions(direction) {
      const container = this.$refs.suggestionsContainer;
      if (container) {
        const scrollAmount = direction === 'left' ? -300 : 300;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    },
    
    // Image error handling
    handleImageError(event, recipe) {
      // First try to use the fallback image specific to the cuisine type
      if (recipe.tipo && this.fallbackImages[recipe.tipo]) {
        event.target.src = this.fallbackImages[recipe.tipo];
      } else {
        // Otherwise use the generic fallback image
        event.target.src = this.fallbackImages.Other || this.defaultImage;
      }
      
      // Add a class for styling
      event.target.classList.add('fallback-image');
    },
    
    // Function to validate and correct image URLs
    validateImageUrl(url) {
      if (!url) return this.defaultImage;
      
      // If the URL doesn't start with http or https, add https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url.replace(/^\/\//, '');
      }
      
      return url;
    },
    
    // Filter recipes by category
    filterByCategory(categoryId) {
      this.selectedCategory = categoryId;
      this.fetchRecipes();
    },
    
    // Check if a recipe is in favorites
    isInFavorites(recipeId) {
      return this.favorites.includes(recipeId);
    },
    
    // Add a recipe to favorites
    addToFavorites(recipeId) {
      if (this.isInFavorites(recipeId)) {
        this.favorites = this.favorites.filter(id => id !== recipeId);
      } else {
        this.favorites.push(recipeId);
      }
    },
    
    // Add a recipe to shopping list
    addToShoppingList(recipeId) {
      // Implementation for shopping list functionality
      console.log("Added recipe to shopping list:", recipeId);
    },
    
    // Share a recipe
    shareRecipe(recipeId) {
      // Implementation for sharing functionality
      console.log("Sharing recipe:", recipeId);
    },
    
    // View recipe details
    viewRecipeDetails(recipeId) {
      // Navigate to recipe details
      console.log("Viewing recipe details:", recipeId);
      // this.$router.push({ name: 'recipe-details', params: { id: recipeId } });
    },
    
    fetchRecipes() {
      this.loading = true;
      this.recipes = []; // Reset recipes array
      
      // Prepare query parameters
      const params = {};
      if (this.selectedCategory !== "All") {
        params.tipo = this.selectedCategory;
      }

      // If there's a search term, use the external API
      if (this.search && this.search.trim() !== "") {
        axios
          .get(`https://dummyjson.com/recipes/search?q=${encodeURIComponent(this.search)}`)
          .then((response) => {
            if (response.data && response.data.recipes && response.data.recipes.length > 0) {
              // Convert API results to our app format
              this.recipes = response.data.recipes.map(apiRecipe => {
                return {
                  id: apiRecipe.id,
                  image: apiRecipe.thumbnail || apiRecipe.image || null,
                  name: apiRecipe.name, 
                  difficulty: this.getDifficultyFromApiRecipe(apiRecipe),
                  categoryId: this.getCategoryFromApiRecipe(apiRecipe),
                  description: apiRecipe.description || "No description available",
                  rating: apiRecipe.rating || 0,
                  cookingTime: apiRecipe.prepTimeMinutes || 0,
                  ingredients: apiRecipe.ingredients || []
                };
              });
              
              // Filter by category if necessary
              if (this.selectedCategory !== "All") {
                this.recipes = this.recipes.filter(recipe => recipe.categoryId === this.selectedCategory);
              }
            } else {
              this.recipes = [];
            }
          })
          .catch((error) => {
            console.error("Error searching for recipes:", error);
            this.recipes = [];
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        // Otherwise use the local database
        axios
          .get("http://localhost:3000/recipes", { params })
          .then((response) => {
            if (response.data && response.data.recipes) {
              // Map database field names to our expected format
              this.recipes = response.data.recipes.map(recipe => ({
                id: recipe.id,
                image: recipe.immagine || recipe.Image || this.getFallbackImageByCategory(recipe.tipo),
                name: recipe.titolo || recipe.name,
                difficulty: recipe.difficolta || 'facile',
                categoryId: recipe.tipo || "Other",
                description: recipe.descrizione || recipe.description || "No description available",
                rating: recipe.rating || 0,
                cookingTime: recipe.tempo || 30,
                ingredients: recipe.ingredienti_essenziali || []
              }));
            } else {
              this.recipes = [];
            }
          })
          .catch((error) => {
            console.error("Error loading recipes:", error);
            this.recipes = [];
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
    
    fetchSuggestions(query) {
      if (!query || query.length < 2) {
        this.searchSuggestions = [];
        return;
      }
      
      this.loadingSuggestions = true;
      axios
        .get(`https://dummyjson.com/recipes/search?q=${encodeURIComponent(query)}&limit=5`)
        .then((response) => {
          if (response.data && response.data.recipes) {
            // Extract only recipe names for suggestions
            this.searchSuggestions = response.data.recipes.map(recipe => recipe.name);
          }
        })
        .catch((error) => {
          console.error("Error loading suggestions:", error);
        })
        .finally(() => {
          this.loadingSuggestions = false;
        });
    },
    
    onSearchChange() {
      this.fetchRecipes();
    },
    
    fetchUserInfo() {
      // Get user information from the server
      axios
        .get("http://localhost:3000/userinfo", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((response) => {
          this.username = response.data.nome || "Cuoco";
        })
        .catch((error) => {
          console.error("Error loading user information:", error);
          this.username = "Cuoco"; // Fallback in case of error
        });
    },
    
    getFallbackImageByCategory(category) {
      if (!category) return this.defaultImage;
      
      return this.fallbackImages[category] || this.defaultImage;
    },
    
    getDifficultyFromApiRecipe(recipe) {
      const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
      
      if (totalTime < 30) return "facile";
      if (totalTime < 60) return "media";
      return "difficile";
    },
    
    getCategoryFromApiRecipe(recipe) {
      if (!recipe.tags || recipe.tags.length === 0) return "Other";
      
      // Map between API tags and our categories
      const categoryMap = {
        "italian": "Italian",
        "india": "Indian", 
        "asian": "Asian",
        "chinese": "Chinese",
        "mexican": "Mexican",
        "american": "American"
      };
      
      // Find the first tag that corresponds to one of our categories
      for (const tag of recipe.tags) {
        const normalizedTag = tag.toLowerCase();
        for (const key in categoryMap) {
          if (normalizedTag.includes(key)) {
            return categoryMap[key];
          }
        }
      }
      
      return "Other";
    }
  },
  mounted() {
    this.fetchRecipes();
    this.fetchUserInfo(); 
  },
};
</script>

<style scoped>
/* Base styles */
.home-view {
  padding-bottom: 40px;
  overflow-x: hidden; /* Prevent horizontal scroll from animations */
}

.container {
  width: 90%;
  max-width: 1280px;
  margin: 0 auto;
}

/* Section styling with enhanced visual separation */
.section-header {
  margin-bottom: 32px;
  position: relative;
}

.section-header h2 {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
  letter-spacing: -0.5px;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40%;
  height: 4px;
  background: var(--primary);
  border-radius: 4px;
  animation: expandWidth 1.5s ease-out forwards;
}

.section-divider {
  display: block;
  height: 4px;
  width: 60px;
  background: var(--primary);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  animation: shimmer 2s infinite;
}

/* Hero section with parallax and dynamic elements */
.hero-section {
  background-image: linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.5)), url('../assets/sfondo.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* Parallax effect */
  color: white;
  padding: 120px 0 100px;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 50% 50% / 15%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(76,175,80,0.2), transparent 60%);
  z-index: 1;
}

.hero-content {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 2;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 12px;
  text-shadow: 0 3px 6px rgba(0,0,0,0.3);
  animation: fadeInDown 1s ease-out;
  background: linear-gradient(135deg, #ffffff 0%, #f2f2f2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}

.user-name {
  color: var(--secondary);
  font-weight: 800;
  position: relative;
  display: inline-block;
  background: #FFC107; /* Amber background for high contrast */
  -webkit-text-fill-color: initial; /* Override parent's transparent text */
  color: #2E7D32; /* Dark green text color */
  padding: 0 8px;
  border-radius: 4px;
  margin: 0 5px;
  text-shadow: 1px 1px 0px rgba(255,255,255,0.7);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  animation: userGlow 3s ease-in-out infinite;
}

.user-name::after {
  content: "";
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #2E7D32;
  border-radius: 3px;
}

.welcome-subtitle {
  font-size: 1.6rem;
  margin-bottom: 40px;
  text-shadow: 0 3px 6px rgba(0,0,0,0.3);
  animation: fadeInDown 1s ease-out 0.3s both;
  font-weight: 300;
}

.search-wrapper {
  max-width: 600px;
  margin: 0 auto;
  animation: fadeInUp 1s ease-out 0.6s both;
  position: relative;
}

.search-wrapper::after {
  content: "";
  position: absolute;
  top: calc(100% + 20px);
  left: calc(50% - 40px);
  width: 80px;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
}

.search-input {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 50px;
  transition: all 0.4s cubic-bezier(.17,.67,.83,.67);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.search-input:hover, .search-input:focus-within {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0,0,0,0.25);
}

/* Categories section with advanced styling */
.categories-section {
  margin-bottom: 60px;
  position: relative;
}

.categories-section::before {
  content: "";
  position: absolute;
  top: 20%;
  right: -150px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(76,175,80,0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.categories-wrapper {
  overflow-x: auto;
  padding: 12px 0;
  scrollbar-width: thin;
  animation: fadeIn 1s ease-out;
  position: relative;
}

.categories-wrapper::-webkit-scrollbar {
  height: 6px;
}

.categories-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--primary);
  border-radius: 3px;
}

.category-chip {
  margin-right: 10px;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: none !important;
  padding: 0 16px !important;
  height: 40px !important;
}

.category-chip:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.category-active {
  background: linear-gradient(135deg, var(--primary) 0%, #2E7D32 100%) !important;
  color: white !important;
  font-weight: 700;
  box-shadow: 0 8px 15px rgba(76, 175, 80, 0.3) !important;
}

/* Recipes section with masonry-like layout */
.recipes-section {
  margin-bottom: 70px;
  min-height: 300px;
  position: relative;
}

.recipes-section::after {
  content: "";
  position: absolute;
  bottom: -20px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
}

.recipes-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loader-wrapper {
  text-align: center;
  animation: pulse 1.5s infinite alternate;
}

.loader-wrapper p {
  margin-top: 20px;
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.no-recipes {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
  animation: fadeIn 0.8s ease-out;
}

.no-recipes h3 {
  margin: 20px 0;
  font-size: 1.8rem;
}

.no-recipes p {
  margin-bottom: 24px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Recipe cards with glass morphism and advanced styling */
.recipes-grid {
  margin-top: 30px;
  perspective: 1000px; /* For 3D effect */
}

.recipe-card {
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  height: 100%;
  position: relative;
  cursor: pointer;
  border: none;
  background: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}

.recipe-card-animated {
  animation: fadeInUp 0.8s ease-out both;
  animation-delay: calc(0.1s * var(--i, 0));
  opacity: 0;
  transform: translateY(30px);
}

.recipe-card:hover {
  transform: translateY(-12px) rotateX(3deg) rotateY(3deg);
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}

.recipe-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  opacity: 0;
  transition: opacity 0.4s ease;
}

.recipe-card:hover::after {
  opacity: 1;
}

.recipe-image {
  position: relative;
  overflow: hidden;
}

.recipe-image v-img {
  transition: transform 0.6s ease;
}

.recipe-card:hover .recipe-image v-img {
  transform: scale(1.1);
}

.category-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, #2E7D32 100%);
  color: white;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.difficulty-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  z-index: 1;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.difficulty-facile {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
}

.difficulty-media {
  background: linear-gradient(135deg, #FFC107 0%, #FF8F00 100%);
  color: #333;
}

.difficulty-difficile {
  background: linear-gradient(135deg, #FF5252 0%, #D32F2F 100%);
  color: white;
}

.recipe-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipe-time {
  background-color: rgba(0,0,0,0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  backdrop-filter: blur(5px);
}

.recipe-time .v-icon {
  margin-right: 6px;
}

.recipe-rating {
  background-color: rgba(0,0,0,0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(5px);
}

.rating-value {
  margin-left: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.recipe-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  padding: 20px 20px 10px;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.recipe-meta {
  padding: 0 20px 10px;
}

.ingredient-tags {
  margin-bottom: 12px;
  min-height: 32px;
}

.ingredient-chip {
  font-size: 0.7rem;
  border-radius: 20px !important;
  font-weight: 600;
}

.recipe-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.recipe-actions {
  padding: 10px 16px 16px;
}

.action-btn {
  transition: all 0.3s ease;
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.action-btn:hover {
  transform: scale(1.2);
  background-color: rgba(76, 175, 80, 0.1) !important;
}

/* Promo section with wave effect and depth */
.promo-section {
  background: linear-gradient(135deg, var(--primary) 0%, #1B5E20 100%);
  color: white;
  padding: 80px 0;
  margin: 60px 0;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}

.promo-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  z-index: 0;
}

.promo-section::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  background: linear-gradient(to top, rgba(27, 94, 32, 0.8), transparent);
  z-index: 1;
}

.promo-content {
  max-width: 650px;
  margin: 0 auto;
  text-align: center;
  animation: fadeIn 1.2s ease-out;
  position: relative;
  z-index: 2;
}

.promo-content h2 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  text-shadow: 0 3px 6px rgba(0,0,0,0.2);
  letter-spacing: -0.5px;
}

.promo-content p {
  font-size: 1.25rem;
  margin-bottom: 30px;
  opacity: 0.9;
  line-height: 1.6;
  font-weight: 300;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.promo-btn {
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 12px 30px !important;
  font-size: 1rem !important;
  letter-spacing: 0.5px;
  border-radius: 50px !important;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
}

.promo-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 30px rgba(0,0,0,0.4) !important;
}

/* Suggestions section with card hover effects */
.suggestions-section {
  margin: 60px 0;
  position: relative;
}

.suggestions-scroll-container {
  position: relative;
  padding: 16px 0;
}

.suggestions-cards {
  display: flex;
  overflow-x: scroll;
  padding: 20px 8px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  position: relative;
  gap: 20px;
}

.suggestions-cards::-webkit-scrollbar {
  display: none;
}

.suggestion-card {
  min-width: 220px;
  margin: 0;
  flex: 0 0 auto;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  transform-origin: center bottom;
}

.suggestion-card:hover {
  transform: translateY(-10px) scale(1.02) rotateX(5deg);
  box-shadow: 0 20px 30px rgba(0,0,0,0.15);
}

.suggestion-title {
  font-size: 1rem;
  font-weight: 600;
  padding: 16px 16px 6px;
  line-height: 1.3;
}

.suggestion-cuisine {
  font-size: 0.8rem;
  padding: 0 16px 16px;
  color: var(--text-secondary);
}

.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background-color: white !important;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
  width: 36px;
  height: 36px;
}

.scroll-left {
  left: -18px;
}

.scroll-right {
  right: -18px;
}

/* Enhanced animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  from { opacity: 0.8; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1.02); }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes expandWidth {
  from { width: 0; }
  to { width: 40%; }
}

/* Responsive enhancement */
@media (max-width: 960px) {
  .welcome-title {
    font-size: 2.8rem;
  }
  
  .promo-section {
    border-radius: 20px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 80px 0 70px;
    border-radius: 0 0 30px 30px;
  }
  
  .welcome-title {
    font-size: 2.2rem;
  }
  
  .welcome-subtitle {
    font-size: 1.3rem;
    margin-bottom: 30px;
  }
  
  .section-header h2 {
    font-size: 1.8rem;
  }
  
  .promo-content h2 {
    font-size: 1.8rem;
  }
  
  .promo-content p {
    font-size: 1.1rem;
  }
  
  .recipe-card {
    margin-bottom: 24px;
  }
  
  .promo-section {
    padding: 60px 20px;
    border-radius: 16px;
  }
}

/* Animated recipe card entrance */
.recipe-card:nth-child(1) { --i: 1; }
.recipe-card:nth-child(2) { --i: 2; }
.recipe-card:nth-child(3) { --i: 3; }
.recipe-card:nth-child(4) { --i: 4; }
.recipe-card:nth-child(5) { --i: 5; }
.recipe-card:nth-child(6) { --i: 6; }
.recipe-card:nth-child(7) { --i: 7; }
.recipe-card:nth-child(8) { --i: 8; }

/* Add floating animation to some elements */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

.promo-btn {
  animation: float 3s ease-in-out infinite;
}

/* Create a subtle stripe pattern for some sections */
.recipes-section,
.suggestions-section,
.categories-section {
  position: relative;
  z-index: 1;
}

.recipes-section::before,
.suggestions-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(135deg, rgba(250, 250, 250, 0.8) 25%, transparent 25%, transparent 50%, rgba(250, 250, 250, 0.8) 50%, rgba(250, 250, 250, 0.8) 75%, transparent 75%, transparent);
  background-size: 20px 20px;
  z-index: -1;
  opacity: 0.3;
}

@keyframes userGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
  50% { box-shadow: 0 0 15px rgba(255, 193, 7, 0.8); }
}
</style>