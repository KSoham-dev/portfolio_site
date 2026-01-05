import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import 'remixicon/fonts/remixicon.css'
import { inject } from '@vercel/analytics'

inject()

createApp(App).mount('#app')
