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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          created_at: string
          id: string
          text: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          last_message_id: string | null
          last_message_type: string | null
          participant1_id: string
          participant2_id: string
          read_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_type?: string | null
          participant1_id: string
          participant2_id: string
          read_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_id?: string | null
          last_message_type?: string | null
          participant1_id?: string
          participant2_id?: string
          read_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          amount: number
          created_at: string
          gift_id: string
          id: string
          recipient_id: string
          sender_id: string
          stream_id: string | null
          total_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          gift_id: string
          id?: string
          recipient_id: string
          sender_id: string
          stream_id?: string | null
          total_price: number
        }
        Update: {
          amount?: number
          created_at?: string
          gift_id?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          stream_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_trending: boolean | null
          name: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_trending?: boolean | null
          name: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_trending?: boolean | null
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          gift_total: number | null
          id: string
          is_live: boolean | null
          is_pvp: boolean | null
          pvp_opponent_id: string | null
          started_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          gift_total?: number | null
          id?: string
          is_live?: boolean | null
          is_pvp?: boolean | null
          pvp_opponent_id?: string | null
          started_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          gift_total?: number | null
          id?: string
          is_live?: boolean | null
          is_pvp?: boolean | null
          pvp_opponent_id?: string | null
          started_at?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          coins: number
          created_at: string
          id: string
          payment_method: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          coins: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coins?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          instagram_url: string | null
          twitter_url: string | null
          updated_at: string
          username: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          instagram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instagram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      pvp_battles: {
        Row: {
          challenger_gifts: number | null
          challenger_id: string
          challenger_stream_id: string | null
          challenger_votes: number | null
          created_at: string
          ended_at: string | null
          id: string
          opponent_gifts: number | null
          opponent_id: string
          opponent_stream_id: string | null
          opponent_votes: number | null
          started_at: string | null
          status: string | null
          winner_id: string | null
        }
        Insert: {
          challenger_gifts?: number | null
          challenger_id: string
          challenger_stream_id?: string | null
          challenger_votes?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          opponent_gifts?: number | null
          opponent_id: string
          opponent_stream_id?: string | null
          opponent_votes?: number | null
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          challenger_gifts?: number | null
          challenger_id?: string
          challenger_stream_id?: string | null
          challenger_votes?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          opponent_gifts?: number | null
          opponent_id?: string
          opponent_stream_id?: string | null
          opponent_votes?: number | null
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pvp_battles_challenger_stream_id_fkey"
            columns: ["challenger_stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_battles_opponent_stream_id_fkey"
            columns: ["opponent_stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_transaction_id: string
          reason: string | null
          status: string
          stripe_refund_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_transaction_id: string
          reason?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_transaction_id?: string
          reason?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          stock: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          stock?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stream_credentials: {
        Row: {
          created_at: string
          id: string
          stream_id: string
          stream_key: string
          stream_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          stream_id: string
          stream_key: string
          stream_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          stream_id?: string
          stream_key?: string
          stream_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_credentials_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: true
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coins: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          autoplay_videos: boolean | null
          created_at: string
          data_saver_mode: boolean | null
          font_size: string | null
          id: string
          language: string | null
          notification_gifts: boolean | null
          notification_live: boolean | null
          notification_pvp: boolean | null
          notification_videos: boolean | null
          privacy_comments: string | null
          privacy_gifts: string | null
          privacy_profile: string | null
          theme: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autoplay_videos?: boolean | null
          created_at?: string
          data_saver_mode?: boolean | null
          font_size?: string | null
          id?: string
          language?: string | null
          notification_gifts?: boolean | null
          notification_live?: boolean | null
          notification_pvp?: boolean | null
          notification_videos?: boolean | null
          privacy_comments?: string | null
          privacy_gifts?: string | null
          privacy_profile?: string | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autoplay_videos?: boolean | null
          created_at?: string
          data_saver_mode?: boolean | null
          font_size?: string | null
          id?: string
          language?: string | null
          notification_gifts?: boolean | null
          notification_live?: boolean | null
          notification_pvp?: boolean | null
          notification_videos?: boolean | null
          privacy_comments?: string | null
          privacy_gifts?: string | null
          privacy_profile?: string | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_hashtags: {
        Row: {
          hashtag_id: string
          video_id: string
        }
        Insert: {
          hashtag_id: string
          video_id: string
        }
        Update: {
          hashtag_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_hashtags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string | null
          created_at: string
          duration: number | null
          id: string
          is_published: boolean | null
          thumbnail: string | null
          updated_at: string
          url: string
          user_id: string
          views: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail?: string | null
          updated_at?: string
          url: string
          user_id: string
          views?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_live_streams: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          description: string
          id: string
          is_live: boolean
          is_pvp: boolean
          started_at: string
          thumbnail_url: string
          title: string
          user_id: string
          viewer_count: number
        }[]
      }
      get_user_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          conversation_id: string
          created_at: string
          last_message: string
          last_message_at: string
          last_message_id: string
          last_message_type: string
          other_user_id: string
          read_at: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
