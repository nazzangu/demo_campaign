import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'campaign-ops',
      component: () => import('@/views/CampaignOpsView.vue'),
    },
    {
      path: '/campaigns',
      name: 'campaign-list',
      component: () => import('@/views/CampaignListView.vue'),
    },
    {
      path: '/campaigns/:id/builder',
      name: 'campaign-builder',
      component: () => import('@/views/CampaignBuilderView.vue'),
    },
    {
      path: '/recommend',
      name: 'campaign-recommend',
      component: () => import('@/views/CampaignRecommendView.vue'),
    },
    {
      path: '/monitoring',
      name: 'campaign-monitoring',
      component: () => import('@/views/CampaignMonitoringView.vue'),
    },
    {
      path: '/analytics',
      name: 'campaign-analytics',
      component: () => import('@/views/CampaignAnalyticsView.vue'),
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('@/views/TemplatesView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
