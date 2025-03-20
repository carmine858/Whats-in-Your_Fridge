import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import UserRegister from '../components/UserRegister.vue';
import UserLogin from '../components/UserLogin.vue';
import ProfileView from '@/views/ProfileView.vue';
import RecipesView from '@/views/RecipesView.vue';

// Funzione per verificare l'autenticazione
const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { loggedIn: false, isAdmin: false, googleAuth: false };
  }

  try {
    const response = await fetch('http://localhost:3000/userinfo', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Token non valido o scaduto');

    const data = await response.json();
    return { 
      loggedIn: true, 
      isAdmin: data.isAdmin || false, 
      googleAuth: data.googleAuth || false 
    };
  } catch (error) {
    console.error('Errore nella verifica autenticazione:', error);
    return { loggedIn: false, isAdmin: false, googleAuth: false };
  }
};

// Definizione delle rotte
const routes = [
  { path: '/register', component: UserRegister },
  { path: '/', component: UserLogin, name: 'login' },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/recipe',
    name: 'recipe',
    component: RecipesView,
    meta: { requiresAuth: true }
  }
];

// Configurazione del router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Middleware per le rotte protette
router.beforeEach(async (to, from, next) => {
  try {
    const { loggedIn, googleAuth } = await isAuthenticated();

    if (to.meta.requiresAuth && !loggedIn) {
      next('/'); // Redirige alla pagina di login se non autenticato
    } else if (to.name === 'login' && (loggedIn || googleAuth)) {
      next('/home'); // Se già autenticato, va direttamente alla home
    } else {
      next();
    }
  } catch (error) {
    console.error("Errore durante la verifica dell'autenticazione:", error);
    next('/'); // Redirige alla pagina di login in caso di errore
  }
});

export default router;
