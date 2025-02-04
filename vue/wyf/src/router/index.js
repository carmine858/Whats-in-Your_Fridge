import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import UserRegister from '../components/UserRegister.vue';
import UserLogin from '../components/UserLogin.vue';
import ProfileView from '@/views/ProfileView.vue';
import RecipesView from '@/views/RecipesView.vue';

// Funzione per verificare l'autenticazione
const isAuthenticated = async () => {
  const userEmail = localStorage.getItem('email');
  const userPassword = localStorage.getItem('password');
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const googleAuth = localStorage.getItem('googleAuth') === 'true'; // Controllo Google OAuth
  const isAdmin = userEmail === 'admin@admin.it' && userPassword === 'admin';

  if (loggedIn || googleAuth) {
    return { loggedIn: true, isAdmin, googleAuth };
  }

  console.log('User not logged in');
  return { loggedIn: false, isAdmin: false, googleAuth: false };
};

// Definizione delle rotte
const routes = [
  { path: '/register', component: UserRegister },
  { path: '/', component: UserLogin },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }, // Rotta protetta
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }, // Rotta protetta
  },
  {
    path: '/recipe',
    name: 'recipe',
    component: RecipesView,
    meta: { requiresAuth: true }, // Rotta protetta
  },

];

// Configurazione del router
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Middleware per le rotte protette
router.beforeEach(async (to, from, next) => {
  try {
    const { loggedIn, isAdmin, googleAuth } = await isAuthenticated(); // Controlla lo stato di autenticazione

    // Se la rotta richiede autenticazione
    if (to.meta.requiresAuth) {
      if (loggedIn) {
        if (isAdmin && to.meta.requiresAdmin && to.path !== '/admin') {
          next('/admin');
        } else if (to.meta.requiresAdmin && !isAdmin) {
          next('/home');
        } else {
          next();
        }
      } else {
        next('/'); // Redirige alla pagina di login
      }
    }
    // Se la rotta è la pagina di login e l'utente è già autenticato
    else if (to.name === 'accedi' && (loggedIn || googleAuth)) {
      if (isAdmin) {
        next('/admin');
      } else {
        next('/home');
      }
    } else {
      next();
    }
  } catch (error) {
    console.error("Errore durante la verifica dell'autenticazione:", error);
    next('/'); // Redirige alla pagina di login in caso di errore
  }
});

export default router;
