export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string }
        Insert: { user_id: string }
        Update: { user_id?: string }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          start_at: string
          end_at: string | null
          location: string | null
          description: string | null
          banner_message: string | null
          published: boolean
          rrule: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_at: string
          end_at?: string | null
          location?: string | null
          description?: string | null
          banner_message?: string | null
          published?: boolean
          rrule?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_at?: string
          end_at?: string | null
          location?: string | null
          description?: string | null
          banner_message?: string | null
          published?: boolean
          rrule?: string | null
          created_at?: string
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          id: number
          message: string
          enabled: boolean
          starts_at: string | null
          ends_at: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          message?: string
          enabled?: boolean
          starts_at?: string | null
          ends_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          message?: string
          enabled?: boolean
          starts_at?: string | null
          ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
