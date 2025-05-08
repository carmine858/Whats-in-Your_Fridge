<template>
    <div class="admin-layout">
      <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-header">
          <h2 class="title">Pannello Admin</h2>
          <button class="sidebar-toggle" @click="toggleSidebar">
            {{ isCollapsed ? '›' : '‹' }}
          </button>
        </div>
        <div class="nav-links">
          <router-link :to="{ name: 'admin-dashboard' }">
            <i class="icon">📊</i>
            <span class="link-text">Dashboard</span>
          </router-link>
          <router-link :to="{ name: 'admin-users' }">
            <i class="icon">👥</i>
            <span class="link-text">Utenti</span>
          </router-link>
          <router-link :to="{ name: 'admin-recipes' }">
            <i class="icon">🍲</i>
            <span class="link-text">Ricette</span>
          </router-link>
        </div>
        <div class="admin-info">
          <span class="username">{{ user.username }}</span>
          <button @click="logout" class="logout-btn">
            <span class="link-text">Logout</span>
          </button>
        </div>
      </div>
      <div class="content" :class="{ 'expanded': isCollapsed }">
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminLayout',
    data() {
      return {
        isCollapsed: false
      }
    },
    computed: {
      user() {
        return JSON.parse(localStorage.getItem('user') || '{}')
      }
    },
    methods: {
      logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.$router.push('/login')
      },
      toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
      },
      checkScreenSize() {
        if (window.innerWidth <= 768) {
          this.isCollapsed = true;
        } else {
          this.isCollapsed = false;
        }
      }
    },
    mounted() {
      // Controlla la dimensione dello schermo all'avvio
      this.checkScreenSize();
      
      // Aggiungi listener per il resize della finestra
      window.addEventListener('resize', this.checkScreenSize);
    },
    beforeDestroy() {
      // Rimuovi l'event listener quando il componente viene distrutto
      window.removeEventListener('resize', this.checkScreenSize);
    }
  }
  </script>
  
  <style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
  }
  
  .sidebar {
    width: 250px;
    background-color: #2c3e50;
    color: white;
    padding: 20px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .sidebar.collapsed {
    width: 70px;
    padding: 20px 10px;
  }
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .sidebar-toggle {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
  }
  
  .title {
    margin: 0;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar.collapsed .title {
    display: none;
  }
  
  .nav-links {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .nav-links a {
    color: white;
    text-decoration: none;
    padding: 10px 15px;
    margin-bottom: 5px;
    border-radius: 5px;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
  }
  
  .icon {
    margin-right: 10px;
    min-width: 20px;
    text-align: center;
  }
  
  .sidebar.collapsed .link-text {
    display: none;
  }
  
  .nav-links a:hover, .nav-links a.router-link-active {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .admin-info {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .sidebar.collapsed .username {
    display: none;
  }
  
  .logout-btn {
    margin-top: 10px;
    padding: 8px 15px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .sidebar.collapsed .logout-btn {
    width: 40px;
    height: 40px;
    padding: 8px;
    border-radius: 50%;
  }
  
  .content {
    flex-grow: 1;
    padding: 20px;
    background-color: #f5f5f5;
    transition: margin-left 0.3s ease;
  }
  
  .content.expanded {
    margin-left: -180px; /* 250px - 70px */
  }
  
  /* Media queries per responsività */
  @media (max-width: 992px) {
    .sidebar {
      width: 200px;
    }
    
    .content.expanded {
      margin-left: -130px; /* 200px - 70px */
    }
  }
  
  @media (max-width: 768px) {
    .sidebar {
      width: 70px;
      padding: 20px 10px;
    }
    
    .sidebar .title {
      display: none;
    }
    
    .sidebar .link-text, 
    .sidebar .username {
      display: none;
    }
    
    .content {
      margin-left: 0;
    }
    
    .logout-btn {
      width: 40px;
      height: 40px;
      padding: 8px;
      border-radius: 50%;
    }
  }
  </style>