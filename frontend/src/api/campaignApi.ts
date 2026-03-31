import client from './client'
import type { Campaign, ApiResponse } from '@/types/campaign'

export const campaignApi = {
  list() {
    return client.get<ApiResponse<Campaign[]>>('/campaigns')
  },

  get(id: number) {
    return client.get<ApiResponse<Campaign>>(`/campaigns/${id}`)
  },

  create(data: { name: string; description?: string; tags?: string[] }) {
    return client.post<ApiResponse<Campaign>>('/campaigns', data)
  },

  update(id: number, data: { name?: string; description?: string; tags?: string[] }) {
    return client.patch<ApiResponse<Campaign>>(`/campaigns/${id}`, data)
  },

  delete(id: number) {
    return client.delete<ApiResponse<void>>(`/campaigns/${id}`)
  },

  saveFlow(id: number, flowGraph: string) {
    return client.put<ApiResponse<Campaign>>(`/campaigns/${id}/flow`, { flowGraph })
  },

  activate(id: number) {
    return client.post<ApiResponse<Campaign>>(`/campaigns/${id}/activate`)
  },

  pause(id: number) {
    return client.post<ApiResponse<Campaign>>(`/campaigns/${id}/pause`)
  },

  stop(id: number) {
    return client.post<ApiResponse<Campaign>>(`/campaigns/${id}/stop`)
  },
}
