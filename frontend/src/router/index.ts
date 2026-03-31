import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'campaign-list',
      component: () => import('@/views/CampaignListView.vue'),
    },
    {
      path: '/campaigns/:id/builder',
      name: 'campaign-builder',
      component: () => import('@/views/CampaignBuilderView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
