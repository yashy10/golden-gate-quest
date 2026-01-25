export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      food_stops: {
        Row: {
          created_at: string
          cuisine: string
          dietary_options: string[] | null
          embedding: string | null
          id: string
          image: string | null
          lat: number
          lng: number
          name: string
          neighborhood: string
          price_range: string
          recommendations: string[] | null
          vibe: string | null
        }
        Insert: {
          created_at?: string
          cuisine: string
          dietary_options?: string[] | null
          embedding?: string | null
          id?: string
          image?: string | null
          lat: number
          lng: number
          name: string
          neighborhood: string
          price_range: string
          recommendations?: string[] | null
          vibe?: string | null
        }
        Update: {
          created_at?: string
          cuisine?: string
          dietary_options?: string[] | null
          embedding?: string | null
          id?: string
          image?: string | null
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string
          price_range?: string
          recommendations?: string[] | null
          vibe?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          accessibility: boolean | null
          address: string | null
          best_time_of_day: string[] | null
          category: string
          created_at: string
          difficulty: string | null
          duration_minutes: number | null
          embedding: string | null
          full_description: string | null
          hero_image: string | null
          hints: string[] | null
          historic_image: string | null
          historic_year: string | null
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string
          short_summary: string | null
          tags: string[] | null
          vibe: string | null
        }
        Insert: {
          accessibility?: boolean | null
          address?: string | null
          best_time_of_day?: string[] | null
          category: string
          created_at?: string
          difficulty?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          full_description?: string | null
          hero_image?: string | null
          hints?: string[] | null
          historic_image?: string | null
          historic_year?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          neighborhood: string
          short_summary?: string | null
          tags?: string[] | null
          vibe?: string | null
        }
        Update: {
          accessibility?: boolean | null
          address?: string | null
          best_time_of_day?: string[] | null
          category?: string
          created_at?: string
          difficulty?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          full_description?: string | null
          hero_image?: string | null
          hints?: string[] | null
          historic_image?: string | null
          historic_year?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string
          short_summary?: string | null
          tags?: string[] | null
          vibe?: string | null
        }
        Relationships: []
      }
      locations_staging: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          cuisine: string | null
          dietary_options: string[] | null
          enriched: boolean | null
          full_description: string | null
          hints: string[] | null
          id: string
          is_food_stop: boolean | null
          lat: number
          lng: number
          name: string
          neighborhood: string | null
          osm_id: string | null
          price_range: string | null
          recommendations: string[] | null
          short_summary: string | null
          source_file: string | null
          vibe: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          cuisine?: string | null
          dietary_options?: string[] | null
          enriched?: boolean | null
          full_description?: string | null
          hints?: string[] | null
          id?: string
          is_food_stop?: boolean | null
          lat: number
          lng: number
          name: string
          neighborhood?: string | null
          osm_id?: string | null
          price_range?: string | null
          recommendations?: string[] | null
          short_summary?: string | null
          source_file?: string | null
          vibe?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          cuisine?: string | null
          dietary_options?: string[] | null
          enriched?: boolean | null
          full_description?: string | null
          hints?: string[] | null
          id?: string
          is_food_stop?: boolean | null
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string | null
          osm_id?: string | null
          price_range?: string | null
          recommendations?: string[] | null
          short_summary?: string | null
          source_file?: string | null
          vibe?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_food_stops: {
        Args: {
          filter_neighborhoods?: string[]
          filter_price_ranges?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          cuisine: string
          dietary_options: string[]
          id: string
          image: string
          lat: number
          lng: number
          name: string
          neighborhood: string
          price_range: string
          recommendations: string[]
          similarity: number
          vibe: string
        }[]
      }
      match_locations: {
        Args: {
          filter_accessible?: boolean
          filter_categories?: string[]
          filter_neighborhoods?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          accessibility: boolean
          address: string
          best_time_of_day: string[]
          category: string
          difficulty: string
          duration_minutes: number
          full_description: string
          hero_image: string
          hints: string[]
          historic_image: string
          historic_year: string
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string
          short_summary: string
          similarity: number
          tags: string[]
          vibe: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
