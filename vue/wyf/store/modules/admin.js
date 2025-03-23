import axios from 'axios'

const state = {
  dashboardData: null,
  users: [],
  recipes: []
}

const mutations = {
  SET_DASHBOARD_DATA(state, data) {
    state.dashboardData = data
  },
  SET_USERS(state, users) {
    state.users = users
  },
  SET_RECIPES(state, recipes) {
    state.recipes = recipes
  }
}

const actions = {
  async fetchDashboardData({ commit }) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      commit('SET_DASHBOARD_DATA', response.data)
      return response.data
    } catch (error) {
      console.error('Errore nel caricamento della dashboard:', error)
      throw error
    }
  },
  async fetchUsers({ commit }) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      commit('SET_USERS', response.data.users)
      return response.data.users
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error)
      throw error
    }
  },
  async deleteUser({ dispatch }, userId) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Ricarica la lista utenti dopo l'eliminazione
      await dispatch('fetchUsers')
      return { success: true }
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'utente:', error)
      throw error
    }
  },
  async fetchRecipes({ commit }) {
    try {
      const response = await axios.get('/recipes')
      commit('SET_RECIPES', response.data.recipes)
      return response.data.recipes
    } catch (error) {
      console.error('Errore nel caricamento delle ricette:', error)
      throw error
    }
  },
  async createRecipe({ dispatch }, recipeData) {
    try {
      const token = localStorage.getItem('token')
      await axios.post('/recipes', recipeData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      })
      // Ricarica la lista ricette dopo la creazione
      await dispatch('fetchRecipes')
      return { success: true }
    } catch (error) {
      console.error('Errore nella creazione della ricetta:', error)
      throw error
    }
  },
  async updateRecipe({ dispatch }, { id, recipeData }) {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/recipes/${id}`, recipeData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      // Ricarica la lista ricette dopo l'aggiornamento
      await dispatch('fetchRecipes')
      return { success: true }
    } catch (error) {
      console.error('Errore nell\'aggiornamento della ricetta:', error)
      throw error
    }
  },
  async deleteRecipe({ dispatch }, recipeId) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/recipes/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Ricarica la lista ricette dopo l'eliminazione
      await dispatch('fetchRecipes')
      return { success: true }
    } catch (error) {
      console.error('Errore nell\'eliminazione della ricetta:', error)
      throw error
    }
  }
}

const getters = {
  dashboardData: state => state.dashboardData,
  users: state => state.users,
  recipes: state => state.recipes
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}