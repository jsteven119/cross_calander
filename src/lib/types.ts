export interface SalesData {
  brandTotal: number | null
  domestic: number | null
}

export interface PromotionItem {
  channel: string
  name: string
}

export interface ProductItem {
  name: string
  count?: number
  type: 'main' | 'sub'
}

export interface CampaignItem {
  title: string
  description: string
  budget?: string
}

export interface MonthData {
  month: number
  sales: SalesData
  promotions: PromotionItem[]
  products: ProductItem[]
  mainCampaign: CampaignItem | null
  continuousCampaign: CampaignItem | null
  ugcContent: string
}

export interface CalendarData {
  year: number
  title: string
  months: MonthData[]
  lastUpdated: string
}

export interface RefreshEvent {
  type: 'refresh'
  timestamp: string
}
