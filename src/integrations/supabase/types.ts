export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      child_users: {
        Row: {
          child_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_users_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string | null
          updated_at: string
          year_group: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id?: string | null
          updated_at?: string
          year_group?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string | null
          updated_at?: string
          year_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string | null
          created_by_user_id: string | null
          date: string
          event_type: string
          id: number
          school_code_required: boolean | null
          school_id: string | null
          source: string | null
          time_end: string | null
          time_start: string | null
          title: string
          updated_at: string | null
          venue: string | null
          visibility: Database["public"]["Enums"]["event_visibility"] | null
          year_group: string
          year_groups: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by_user_id?: string | null
          date: string
          event_type: string
          id?: number
          school_code_required?: boolean | null
          school_id?: string | null
          source?: string | null
          time_end?: string | null
          time_start?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"] | null
          year_group?: string
          year_groups?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by_user_id?: string | null
          date?: string
          event_type?: string
          id?: number
          school_code_required?: boolean | null
          school_id?: string | null
          source?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"] | null
          year_group?: string
          year_groups?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_user"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_admins: {
        Row: {
          created_at: string | null
          id: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_authorizations: {
        Row: {
          created_at: string | null
          id: string
          is_approved: boolean | null
          school_code: string
          school_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          school_code: string
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          school_code?: string
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_authorizations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          duplicate_of: string | null
          id: string
          name: string
          school_code: string
          term_dates_url: string | null
          updated_at: string
          year_groups: string[] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          name: string
          school_code: string
          term_dates_url?: string | null
          updated_at?: string
          year_groups?: string[] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          name?: string
          school_code?: string
          term_dates_url?: string | null
          updated_at?: string
          year_groups?: string[] | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean | null
          created_at: string | null
          created_by_user_id: string | null
          event_id: number | null
          id: number
          text: string
          todo_type: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          event_id?: number | null
          id?: number
          text: string
          todo_type: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          event_id?: number | null
          id?: number
          text?: string
          todo_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_todos_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_todos_user"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekend_plans: {
        Row: {
          category: string
          child_id: string | null
          created_at: string
          date: string
          id: string
          time: string
          title: string
          updated_at: string
          venue: string
          year_group: string
        }
        Insert: {
          category: string
          child_id?: string | null
          created_at?: string
          date: string
          id?: string
          time: string
          title: string
          updated_at?: string
          venue: string
          year_group: string
        }
        Update: {
          category?: string
          child_id?: string | null
          created_at?: string
          date?: string
          id?: string
          time?: string
          title?: string
          updated_at?: string
          venue?: string
          year_group?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekend_plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_school_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      event_visibility: "private" | "public" | "verified_shared"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_visibility: ["private", "public", "verified_shared"],
    },
  },
} as const
