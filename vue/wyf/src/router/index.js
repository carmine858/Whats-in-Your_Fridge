import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import UserRegister from '../components/UserRegister.vue';
import UserLogin from '../components/UserLogin.vue';
import ProfileView from '@/views/ProfileView.vue';
import AdminView from '@/views/AdminView.vue';
import RecipeChat from '@/views/RecipeChat.vue';

// Funzione per verificare l'autenticazione
const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { loggedIn: false, role: null, googleAuth: false };
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
      role: data.role || 'user',
      googleAuth: data.googleAuth || false 
    };
  } catch (error) {
    console.error('Errore nella verifica autenticazione:', error);
    return { loggedIn: false, role: null, googleAuth: false };
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
    path: '/chat',
    name: 'chat',
    component: RecipeChat,
    meta: { requiresAuth: true }
  },
  // Area Admin
  {
    path: '/admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: { name: 'admin-dashboard' }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../components/admin/AdminDashboard.vue')
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../components/admin/UsersList.vue')
      }
    ]
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
    const { loggedIn, role, googleAuth } = await isAuthenticated();

    // Verifica se la rotta richiede privilegi di admin
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

    if (to.meta.requiresAuth && !loggedIn) {
      next('/'); // Redirige alla pagina di login se non autenticato
    } else if (requiresAdmin && role !== 'admin') {
      next('/home'); // Redirige alla home se non admin
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