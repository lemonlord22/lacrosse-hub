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
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          author_id: string
          body: string
          created_at: string
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          author_id: string
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          file_path: string
          id: string
          name: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_path: string
          id?: string
          name: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          file_path?: string
          id?: string
          name?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      drill_submissions: {
        Row: {
          clip_url: string | null
          coach_feedback: string | null
          created_at: string
          drill_id: string
          id: string
          note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clip_url?: string | null
          coach_feedback?: string | null
          created_at?: string
          drill_id: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clip_url?: string | null
          coach_feedback?: string | null
          created_at?: string
          drill_id?: string
          id?: string
          note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_submissions_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          title: string
          video_url: string | null
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          title: string
          video_url?: string | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          map_url: string | null
          notes: string | null
          start_at: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          map_url?: string | null
          notes?: string | null
          start_at: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          map_url?: string | null
          notes?: string | null
          start_at?: string
          title?: string
        }
        Relationships: []
      }
      film_clip_tags: {
        Row: {
          clip_id: string
          id: string
          user_id: string
        }
        Insert: {
          clip_id: string
          id?: string
          user_id: string
        }
        Update: {
          clip_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "film_clip_tags_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "film_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      film_clips: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          video_url: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          video_url: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      film_comments: {
        Row: {
          author_id: string
          body: string
          clip_id: string
          created_at: string
          id: string
          timestamp_seconds: number
        }
        Insert: {
          author_id: string
          body: string
          clip_id: string
          created_at?: string
          id?: string
          timestamp_seconds?: number
        }
        Update: {
          author_id?: string
          body?: string
          clip_id?: string
          created_at?: string
          id?: string
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "film_comments_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "film_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          pinned: boolean
          room: Database["public"]["Enums"]["chat_room"]
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          room: Database["public"]["Enums"]["chat_room"]
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          room?: Database["public"]["Enums"]["chat_room"]
        }
        Relationships: []
      }
      photos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          created_at: string
          file_path: string
          id: string
          status: string
          tag: string | null
          uploader_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          status?: string
          tag?: string | null
          uploader_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          status?: string
          tag?: string | null
          uploader_id?: string
        }
        Relationships: []
      }
      playbook_items: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          created_at: string
          created_by: string
          description: string | null
          diagram_url: string | null
          file_path: string | null
          id: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by: string
          description?: string | null
          diagram_url?: string | null
          file_path?: string | null
          id?: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          created_at?: string
          created_by?: string
          description?: string | null
          diagram_url?: string | null
          file_path?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          is_correct: boolean
          label: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_correct?: boolean
          label: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_correct?: boolean
          label?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          audience: Database["public"]["Enums"]["audience"]
          closes_at: string | null
          created_at: string
          created_by: string
          id: string
          question: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience"]
          closes_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          question: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience"]
          closes_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          question?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          child_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          team_level: Database["public"]["Enums"]["team_level"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          child_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          team_level?: Database["public"]["Enums"]["team_level"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          child_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          team_level?: Database["public"]["Enums"]["team_level"]
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          comment: string | null
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          event_id: string
          id?: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_audience: {
        Args: {
          _audience: Database["public"]["Enums"]["audience"]
          _user_id: string
        }
        Returns: boolean
      }
      can_see_room: {
        Args: {
          _room: Database["public"]["Enums"]["chat_room"]
          _user_id: string
        }
        Returns: boolean
      }
      get_team_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["team_level"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coach" | "player" | "parent"
      audience: "all" | "parents" | "jv" | "varsity" | "coaches"
      chat_room: "parents" | "jv" | "varsity" | "coaches" | "all"
      rsvp_status: "going" | "maybe" | "not_going"
      team_level: "jv" | "varsity" | "parent" | "coach" | "none"
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
      app_role: ["admin", "coach", "player", "parent"],
      audience: ["all", "parents", "jv", "varsity", "coaches"],
      chat_room: ["parents", "jv", "varsity", "coaches", "all"],
      rsvp_status: ["going", "maybe", "not_going"],
      team_level: ["jv", "varsity", "parent", "coach", "none"],
    },
  },
} as const
