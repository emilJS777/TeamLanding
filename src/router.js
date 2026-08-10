import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import StartProjectView from './views/StartProjectView.vue'
import ContactView from './views/ContactView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/start-project', name: 'start-project', component: StartProjectView },
    { path: '/contact', name: 'contact', component: ContactView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
