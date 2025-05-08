import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import store from './store'
import './assets/theme.scss'

const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(store)
app.mount('#app')