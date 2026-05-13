export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          role_type: string | null
          onboarding_module: string | null
          interests: string[] | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          role_type?: string | null
          onboarding_module?: string | null
          interests?: string[] | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          role_type?: string | null
          onboarding_module?: string | null
          interests?: string[] | null
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          country: string | null
          school_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          country?: string | null
          school_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          country?: string | null
          school_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      children: {
        Row: {
          id: string
          profile_id: string
          school_id: string | null
          name: string
          year_group: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          school_id?: string | null
          name: string
          year_group?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          school_id?: string | null
          name?: string
          year_group?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      school_authorizations: {
        Row: {
          id: string
          user_id: string
          school_id: string
          school_code: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          school_code: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          school_code?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_authorizations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_authorizations_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      school_admins: {
        Row: {
          id: string
          user_id: string
          school_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      music_learners: {
        Row: {
          id: string
          user_id: string
          name: string
          instrument: string
          current_grade: number
          learner_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          instrument: string
          current_grade?: number
          learner_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          instrument?: string
          current_grade?: number
          learner_type?: string
          created_at?: string
        }
      }
      learner_access: {
        Row: {
          id: string
          learner_id: string
          user_id: string
          access_type: string
          granted_by: string
          created_at: string
          status: string
          shared_resource: string
          share_code: string | null
        }
        Insert: {
          id?: string
          learner_id: string
          user_id: string
          access_type: string
          granted_by: string
          created_at?: string
          status?: string
          shared_resource?: string
          share_code?: string | null
        }
        Update: {
          id?: string
          learner_id?: string
          user_id?: string
          access_type?: string
          granted_by?: string
          created_at?: string
          status?: string
          shared_resource?: string
          share_code?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 