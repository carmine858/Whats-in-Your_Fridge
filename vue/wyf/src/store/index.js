import { createStore } from 'vuex'
import admin from './modules/admin'

export default createStore({
  state: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
    },
    setLoading(state, status) {
      state.loading = status;
    },
    setError(state, error) {
      state.error = error;
    },
    clearError(state) {
      state.error = null;
    }
  },
  actions: {
    login({ commit }, user) {
      commit('setUser', user);
    },
    logout({ commit }) {
      localStorage.removeItem('token');
      commit('setUser', null);
    }
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user,
    isLoading: state => state.loading,
    error: state => state.error
  },
  modules: {
    admin
  }
})