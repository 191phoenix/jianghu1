import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  // hash 路由：适配 PWA / 任意静态托管，无需服务器配置
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/jianghu', name: 'jianghu', component: () => import('@/views/JianghuView.vue') },
    { path: '/inventory', name: 'inventory', component: () => import('@/views/InventoryView.vue') },
    { path: '/heroes', name: 'heroes', component: () => import('@/views/HeroesView.vue') },
    { path: '/character', name: 'character', component: () => import('@/views/CharacterView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
  ]
})

export default router
