export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export interface Campaign {
  id: number
  campaignKey: string
  name: string
  description: string | null
  status: CampaignStatus
  tags: string[]
  flowGraph: string | null
  createdAt: string
  updatedAt: string
  activatedAt: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | null
}
