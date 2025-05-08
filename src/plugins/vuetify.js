// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#4CAF50',
          secondary: '#FF9800',
          accent: '#03A9F4',
          error: '#F44336',
          warning: '#FFB300',
          info: '#2196F3',
          success: '#00C853'
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

export default vuetify