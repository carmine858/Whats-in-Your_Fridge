export default {
  namespaced: true,
  state: {
    users: [],
    recipes: []
  },
  mutations: {
    setUsers(state, users) {
      state.users = users;
    },
    setRecipes(state, recipes) {
      state.recipes = recipes;
    }
  },
  actions: {
    async fetchUsers({ commit }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3000/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        commit('setUsers', data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    },
    
    async fetchAllRecipes({ commit }) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3000/admin/recipes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        commit('setRecipes', data.recipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    }
  },
  getters: {
    allUsers: state => state.users,
    allRecipes: state => state.recipes
  }
}