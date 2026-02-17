export type ProfileRole = "admin" | "collector" | "other"

export interface Database {
  public: {
    Tables: {
      carnet: {
        Row: {
          id: string
          number: string
          month: string | null
          initial_amount: number
          price: number
          currency: number
          client_code: string | null
          authorized_withdrawal_person: string | null
          document_url: string | null
          is_archived: boolean
          validated_at: string | null
          granted_at: string | null
          validated_by: string | null
          granted_by: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          number: string
          month?: string | null
          initial_amount?: number
          price: number
          currency?: number
          client_code?: string | null
          authorized_withdrawal_person?: string | null
          document_url?: string | null
          is_archived?: boolean
          validated_at?: string | null
          granted_at?: string | null
          validated_by?: string | null
          granted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
        }
        Update: {
          number?: string
          month?: string | null
          initial_amount?: number
          price?: number
          currency?: number
          client_code?: string | null
          authorized_withdrawal_person?: string | null
          document_url?: string | null
          is_archived?: boolean
          validated_at?: string | null
          granted_at?: string | null
          validated_by?: string | null
          granted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      zone_user: {
        Row: {
          id: string
          zone_id: string
          user_id: string
          unassigned_at: string | null
          unassigned_by: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          zone_id: string
          user_id: string
          unassigned_at?: string | null
          unassigned_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
        }
        Update: {
          zone_id?: string
          user_id?: string
          unassigned_at?: string | null
          unassigned_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      zone: {
        Row: {
          id: string
          name: string
          code: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          id: string
          user_id: string
          phone: string | null
          function: ProfileRole | null
          avatar_url: string | null
          zone_id: string | null
          created_at: string | null
          updated_at: string | null
          username: string | null
          email: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone?: string | null
          function?: ProfileRole | null
          avatar_url?: string | null
          zone_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          email?: string | null
        }
        Update: {
          user_id?: string
          phone?: string | null
          function?: ProfileRole | null
          avatar_url?: string | null
          zone_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          email?: string | null
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

export type Profile = Database["public"]["Tables"]["user_profile"]["Row"]
export type Zone = Database["public"]["Tables"]["zone"]["Row"]
export type ZoneUser = Database["public"]["Tables"]["zone_user"]["Row"]
export type Carnet = Database["public"]["Tables"]["carnet"]["Row"]
