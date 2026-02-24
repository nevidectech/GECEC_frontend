export type ProfileRole = "admin" | "collector" | "other"

export interface Database {
  public: {
    Tables: {
      withdrawal: {
        Row: {
          id: string
          carnet_id: string
          withdrawal_date: string
          amount: number
          currency: number
          withdrawal_type: number
          order_type: number
          card_number: string | null
          proof_url: string | null
          deleted_by: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          carnet_id: string
          withdrawal_date: string
          amount: number
          currency?: number
          withdrawal_type?: number
          order_type?: number
          card_number?: string | null
          proof_url?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
        }
        Update: {
          carnet_id?: string
          withdrawal_date?: string
          amount?: number
          currency?: number
          withdrawal_type?: number
          order_type?: number
          card_number?: string | null
          proof_url?: string | null
          deleted_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      global_variable: {
        Row: {
          id: string
          group: string
          key: string
          value: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          group: string
          key: string
          value: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          group?: string
          key?: string
          value?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client: {
        Row: {
          id: string
          first_name: string
          last_name: string
          card_number: string | null
          gender: number
          email: string | null
          address: string | null
          job_title: string | null
          signature: string | null
          phone: string
          code: string
          zone_id: string
          username: string | null
          password_hash: string | null
          status: number
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          card_number?: string | null
          gender: number
          email?: string | null
          address?: string | null
          job_title?: string | null
          signature?: string | null
          phone: string
          code: string
          zone_id: string
          username?: string | null
          password_hash?: string | null
          status?: number
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
        }
        Update: {
          first_name?: string
          last_name?: string
          card_number?: string | null
          gender?: number
          email?: string | null
          address?: string | null
          job_title?: string | null
          signature?: string | null
          phone?: string
          code?: string
          zone_id?: string
          username?: string | null
          password_hash?: string | null
          status?: number
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
        }
        Relationships: []
      }
      cotisation: {
        Row: {
          id: string
          carnet_id: string
          transaction_code: string | null
          receipt_number: string | null
          amount: number
          currency: number
          cotisation_date: string
          justification_url: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          carnet_id: string
          transaction_code?: string | null
          receipt_number?: string | null
          amount: number
          currency?: number
          cotisation_date: string
          justification_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
        }
        Update: {
          carnet_id?: string
          transaction_code?: string | null
          receipt_number?: string | null
          amount?: number
          currency?: number
          cotisation_date?: string
          justification_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      carnet_duplicate: {
        Row: {
          id: string
          original_carnet_id: string
          number: string
          month: string | null
          initial_amount: number
          price: number
          currency: number
          client_code: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          original_carnet_id: string
          number: string
          month?: string | null
          initial_amount?: number
          price: number
          currency?: number
          client_code?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by: string
          updated_by?: string | null
        }
        Update: {
          original_carnet_id?: string
          number?: string
          month?: string | null
          initial_amount?: number
          price?: number
          currency?: number
          client_code?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string
          updated_by?: string | null
        }
        Relationships: []
      }
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
export type Cotisation = Database["public"]["Tables"]["cotisation"]["Row"]
export type CarnetDuplicate = Database["public"]["Tables"]["carnet_duplicate"]["Row"]
export type Client = Database["public"]["Tables"]["client"]["Row"]
export type GlobalVariable = Database["public"]["Tables"]["global_variable"]["Row"]
export type Withdrawal = Database["public"]["Tables"]["withdrawal"]["Row"]
