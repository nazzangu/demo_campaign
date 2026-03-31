import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Campaign } from '@/types/campaign'

export const useCampaignStore = defineStore('campaign', () => {
  const currentCampaign = ref<Campaign | null>(null)

  function setCampaign(campaign: Campaign) {
    currentCampaign.value = campaign
  }

  function clearCampaign() {
    currentCampaign.value = null
  }

  return { currentCampaign, setCampaign, clearCampaign }
})
