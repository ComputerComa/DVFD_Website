export interface EventRow {
  id: string
  title: string
  start_at: string
  end_at: string | null
  location: string | null
  description: string | null
  banner_message: string | null
  published: boolean
  rrule: string | null
  created_at?: string
}

export interface SiteBanner {
  id: number
  message: string
  enabled: boolean
  starts_at: string | null
  ends_at: string | null
  updated_at?: string
}

export interface AdminUser {
  id: string
  email: string
  confirmed: boolean
  createdAt: string
  isAdmin: boolean
}

export interface SelectedEvent {
  title: string
  details?: string
  location?: string
}
