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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      generation_batches: {
        Row: {
          analysis_id: string | null
          completed_at: string | null
          completed_videos: number | null
          created_at: string | null
          failed_videos: number | null
          id: string
          status: string | null
          total_videos: number
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          completed_at?: string | null
          completed_videos?: number | null
          created_at?: string | null
          failed_videos?: number | null
          id?: string
          status?: string | null
          total_videos: number
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          completed_at?: string | null
          completed_videos?: number | null
          created_at?: string | null
          failed_videos?: number | null
          id?: string
          status?: string | null
          total_videos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_batches_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "video_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          base_image_url: string
          character_sheet: Json | null
          created_at: string | null
          el_voice_id: string | null
          el_voice_name: string | null
          id: string
          is_default: boolean | null
          name: string
          persona_type: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          base_image_url: string
          character_sheet?: Json | null
          created_at?: string | null
          el_voice_id?: string | null
          el_voice_name?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          persona_type: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          base_image_url?: string
          character_sheet?: Json | null
          created_at?: string | null
          el_voice_id?: string | null
          el_voice_name?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          persona_type?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ugc_projects: {
        Row: {
          batch_id: string | null
          cloned_voice_id: string | null
          created_at: string | null
          credits_used: number | null
          cta: string
          current_step: string | null
          error_message: string | null
          hook_3s: string | null
          hook_type: string
          id: string
          key_benefit: string
          opening_video_url: string | null
          persona_image_url: string | null
          persona_type: string
          pipeline_mode: string | null
          product_image_url: string
          product_name: string
          scene_clips: Json | null
          script: string | null
          source_analysis_id: string | null
          status: string | null
          steps_data: Json | null
          updated_at: string | null
          user_id: string
          variant_style: string | null
          video_style: string
          voiceover_urls: Json | null
        }
        Insert: {
          batch_id?: string | null
          cloned_voice_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          cta?: string
          current_step?: string | null
          error_message?: string | null
          hook_3s?: string | null
          hook_type: string
          id?: string
          key_benefit: string
          opening_video_url?: string | null
          persona_image_url?: string | null
          persona_type: string
          pipeline_mode?: string | null
          product_image_url: string
          product_name: string
          scene_clips?: Json | null
          script?: string | null
          source_analysis_id?: string | null
          status?: string | null
          steps_data?: Json | null
          updated_at?: string | null
          user_id: string
          variant_style?: string | null
          video_style: string
          voiceover_urls?: Json | null
        }
        Update: {
          batch_id?: string | null
          cloned_voice_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          cta?: string
          current_step?: string | null
          error_message?: string | null
          hook_3s?: string | null
          hook_type?: string
          id?: string
          key_benefit?: string
          opening_video_url?: string | null
          persona_image_url?: string | null
          persona_type?: string
          pipeline_mode?: string | null
          product_image_url?: string
          product_name?: string
          scene_clips?: Json | null
          script?: string | null
          source_analysis_id?: string | null
          status?: string | null
          steps_data?: Json | null
          updated_at?: string | null
          user_id?: string
          variant_style?: string | null
          video_style?: string
          voiceover_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ugc_projects_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "generation_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_projects_source_analysis_id_fkey"
            columns: ["source_analysis_id"]
            isOneToOne: false
            referencedRelation: "video_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          anthropic_key: string | null
          assemblyai_key: string | null
          brand_name: string | null
          created_at: string | null
          credits_cached: number | null
          credits_updated_at: string | null
          default_cta: string | null
          default_persona: string | null
          elevenlabs_api_key: string | null
          id: string
          kie_api_key: string | null
          rapidapi_key: string | null
        }
        Insert: {
          anthropic_key?: string | null
          assemblyai_key?: string | null
          brand_name?: string | null
          created_at?: string | null
          credits_cached?: number | null
          credits_updated_at?: string | null
          default_cta?: string | null
          default_persona?: string | null
          elevenlabs_api_key?: string | null
          id: string
          kie_api_key?: string | null
          rapidapi_key?: string | null
        }
        Update: {
          anthropic_key?: string | null
          assemblyai_key?: string | null
          brand_name?: string | null
          created_at?: string | null
          credits_cached?: number | null
          credits_updated_at?: string | null
          default_cta?: string | null
          default_persona?: string | null
          elevenlabs_api_key?: string | null
          id?: string
          kie_api_key?: string | null
          rapidapi_key?: string | null
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          analysis_result: Json | null
          compliance_filter: boolean | null
          created_at: string | null
          id: string
          manual_script: string | null
          original_likes: number | null
          original_plays: number | null
          original_shares: number | null
          product_category: string | null
          product_name: string
          raw_transcript: string | null
          source_url: string | null
          target_platform: string | null
          user_id: string
          variants_count: number | null
        }
        Insert: {
          analysis_result?: Json | null
          compliance_filter?: boolean | null
          created_at?: string | null
          id?: string
          manual_script?: string | null
          original_likes?: number | null
          original_plays?: number | null
          original_shares?: number | null
          product_category?: string | null
          product_name: string
          raw_transcript?: string | null
          source_url?: string | null
          target_platform?: string | null
          user_id: string
          variants_count?: number | null
        }
        Update: {
          analysis_result?: Json | null
          compliance_filter?: boolean | null
          created_at?: string | null
          id?: string
          manual_script?: string | null
          original_likes?: number | null
          original_plays?: number | null
          original_shares?: number | null
          product_category?: string | null
          product_name?: string
          raw_transcript?: string | null
          source_url?: string | null
          target_platform?: string | null
          user_id?: string
          variants_count?: number | null
        }
        Relationships: []
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
