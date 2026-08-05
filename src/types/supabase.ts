/**
 * Hand-written to match the migrations in supabase/migrations/ until the
 * project is linked to Supabase and we can regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 */
export type UserRole = "admin" | "teacher";
export type UserStatus = "active" | "blocked" | "pending";
export type ActiveStatus = "active" | "inactive";
export type ContentStatus = "draft" | "scheduled" | "published" | "hidden" | "archived";
export type ContentAccessType = "public" | "free_signup" | "teacher_only" | "subscriber_only";
export type ContentDifficulty = "easy" | "medium" | "hard";
export type BillingPeriod = "free" | "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "canceled";

type CatalogRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  status: ActiveStatus;
  created_at: string;
  updated_at: string;
};

type CatalogInsert = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  order_index?: number;
  status?: ActiveStatus;
  created_at?: string;
  updated_at?: string;
};

type CatalogUpdate = Partial<CatalogInsert>;

// Shape shared by every `content_<x>` many-to-many join table: an id, the
// content_id, and one other foreign key column (name varies per table).
type LinkTable<TCol extends string> = {
  Row: { id: string; content_id: string } & Record<TCol, string>;
  Insert: { id?: string; content_id: string } & Record<TCol, string>;
  Update: Partial<{ id: string; content_id: string } & Record<TCol, string>>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name?: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      education_levels: {
        Row: CatalogRow;
        Insert: CatalogInsert;
        Update: CatalogUpdate;
        Relationships: [];
      };

      grades: {
        Row: CatalogRow & { education_level_id: string };
        Insert: CatalogInsert & { education_level_id: string };
        Update: Partial<CatalogInsert & { education_level_id: string }>;
        Relationships: [];
      };

      subjects: {
        Row: CatalogRow & {
          short_name: string | null;
          icon: string | null;
          image_url: string | null;
          color: string | null;
        };
        Insert: CatalogInsert & {
          short_name?: string | null;
          icon?: string | null;
          image_url?: string | null;
          color?: string | null;
        };
        Update: Partial<
          CatalogInsert & {
            short_name: string | null;
            icon: string | null;
            image_url: string | null;
            color: string | null;
          }
        >;
        Relationships: [];
      };

      grade_subjects: {
        Row: { id: string; grade_id: string; subject_id: string; created_at: string };
        Insert: { id?: string; grade_id: string; subject_id: string; created_at?: string };
        Update: { id?: string; grade_id?: string; subject_id?: string; created_at?: string };
        Relationships: [];
      };

      curriculum_units: {
        Row: CatalogRow & { grade_id: string; subject_id: string };
        Insert: CatalogInsert & { grade_id: string; subject_id: string };
        Update: Partial<CatalogInsert & { grade_id: string; subject_id: string }>;
        Relationships: [];
      };

      themes: {
        Row: CatalogRow & { curriculum_unit_id: string };
        Insert: CatalogInsert & { curriculum_unit_id: string };
        Update: Partial<CatalogInsert & { curriculum_unit_id: string }>;
        Relationships: [];
      };

      subthemes: {
        Row: CatalogRow & { theme_id: string };
        Insert: CatalogInsert & { theme_id: string };
        Update: Partial<CatalogInsert & { theme_id: string }>;
        Relationships: [];
      };

      content_types: {
        Row: CatalogRow & { icon: string | null };
        Insert: CatalogInsert & { icon?: string | null };
        Update: Partial<CatalogInsert & { icon: string | null }>;
        Relationships: [];
      };

      contents: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          short_description: string | null;
          body: string | null;
          cover_url: string | null;
          author: string | null;
          difficulty: ContentDifficulty | null;
          access_type: ContentAccessType;
          status: ContentStatus;
          allow_view: boolean;
          allow_download: boolean;
          allow_print: boolean;
          allow_comments: boolean;
          has_answer_key: boolean;
          is_featured: boolean;
          publish_at: string | null;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          short_description?: string | null;
          body?: string | null;
          cover_url?: string | null;
          author?: string | null;
          difficulty?: ContentDifficulty | null;
          access_type?: ContentAccessType;
          status?: ContentStatus;
          allow_view?: boolean;
          allow_download?: boolean;
          allow_print?: boolean;
          allow_comments?: boolean;
          has_answer_key?: boolean;
          is_featured?: boolean;
          publish_at?: string | null;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contents"]["Insert"]>;
        Relationships: [];
      };

      content_grades: LinkTable<"grade_id">;
      content_subjects: LinkTable<"subject_id">;
      content_units: LinkTable<"curriculum_unit_id">;
      content_themes: LinkTable<"theme_id">;
      content_subthemes: LinkTable<"subtheme_id">;
      content_content_types: LinkTable<"content_type_id">;
      content_tags: LinkTable<"tag_id">;

      tags: {
        Row: { id: string; name: string; slug: string; status: ActiveStatus };
        Insert: { id?: string; name: string; slug: string; status?: ActiveStatus };
        Update: Partial<{ id: string; name: string; slug: string; status: ActiveStatus }>;
        Relationships: [];
      };

      content_files: {
        Row: {
          id: string;
          content_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          mime_type: string;
          file_size: number;
          allow_download: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          mime_type: string;
          file_size: number;
          allow_download?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_files"]["Insert"]>;
        Relationships: [];
      };

      favorites: {
        Row: { id: string; teacher_id: string; content_id: string; created_at: string };
        Insert: { id?: string; teacher_id: string; content_id: string; created_at?: string };
        Update: Partial<{ id: string; teacher_id: string; content_id: string; created_at: string }>;
        Relationships: [];
      };

      content_views: {
        Row: {
          id: string;
          teacher_id: string | null;
          content_id: string;
          viewed_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          content_id: string;
          viewed_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_views"]["Insert"]>;
        Relationships: [];
      };

      downloads: {
        Row: {
          id: string;
          teacher_id: string | null;
          content_id: string;
          content_file_id: string | null;
          downloaded_at: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          content_id: string;
          content_file_id?: string | null;
          downloaded_at?: string;
          ip_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["downloads"]["Insert"]>;
        Relationships: [];
      };

      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          billing_period: BillingPeriod;
          download_limit: number | null;
          features: string[];
          status: ActiveStatus;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          billing_period?: BillingPeriod;
          download_limit?: number | null;
          features?: string[];
          status?: ActiveStatus;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };

      subscriptions: {
        Row: {
          id: string;
          teacher_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          starts_at: string;
          expires_at: string | null;
          payment_provider: string | null;
          external_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          starts_at?: string;
          expires_at?: string | null;
          payment_provider?: string | null;
          external_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };

      access_grants: {
        Row: {
          id: string;
          teacher_id: string;
          content_id: string | null;
          course_id: string | null;
          folder_id: string | null;
          granted_by: string | null;
          starts_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          content_id?: string | null;
          course_id?: string | null;
          folder_id?: string | null;
          granted_by?: string | null;
          starts_at?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_grants"]["Insert"]>;
        Relationships: [];
      };

      folders: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_url: string | null;
          access_type: ContentAccessType;
          status: ContentStatus;
          published_at: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_url?: string | null;
          access_type?: ContentAccessType;
          status?: ContentStatus;
          published_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["folders"]["Insert"]>;
        Relationships: [];
      };

      folder_contents: {
        Row: { id: string; folder_id: string; content_id: string; order_index: number };
        Insert: { id?: string; folder_id: string; content_id: string; order_index?: number };
        Update: Partial<{ id: string; folder_id: string; content_id: string; order_index: number }>;
        Relationships: [];
      };

      bncc_stages: {
        Row: { id: string; name: string; order_index: number };
        Insert: { id?: string; name: string; order_index?: number };
        Update: Partial<{ id: string; name: string; order_index: number }>;
        Relationships: [];
      };

      bncc_knowledge_areas: {
        Row: { id: string; stage_id: string; name: string; order_index: number };
        Insert: { id?: string; stage_id: string; name: string; order_index?: number };
        Update: Partial<{ id: string; stage_id: string; name: string; order_index: number }>;
        Relationships: [];
      };

      bncc_components: {
        Row: { id: string; knowledge_area_id: string; name: string; order_index: number };
        Insert: { id?: string; knowledge_area_id: string; name: string; order_index?: number };
        Update: Partial<{ id: string; knowledge_area_id: string; name: string; order_index: number }>;
        Relationships: [];
      };

      bncc_skills: {
        Row: {
          id: string;
          component_id: string;
          grade_id: string | null;
          code: string;
          description: string;
          thematic_unit: string | null;
          knowledge_object: string | null;
          status: ActiveStatus;
        };
        Insert: {
          id?: string;
          component_id: string;
          grade_id?: string | null;
          code: string;
          description: string;
          thematic_unit?: string | null;
          knowledge_object?: string | null;
          status?: ActiveStatus;
        };
        Update: Partial<Database["public"]["Tables"]["bncc_skills"]["Insert"]>;
        Relationships: [];
      };

      content_bncc_skills: {
        Row: { id: string; content_id: string; bncc_skill_id: string };
        Insert: { id?: string; content_id: string; bncc_skill_id: string };
        Update: Partial<{ id: string; content_id: string; bncc_skill_id: string }>;
        Relationships: [];
      };

      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_url: string | null;
          instructor: string | null;
          workload_hours: number | null;
          access_type: ContentAccessType;
          certificate_enabled: boolean;
          status: ContentStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_url?: string | null;
          instructor?: string | null;
          workload_hours?: number | null;
          access_type?: ContentAccessType;
          certificate_enabled?: boolean;
          status?: ContentStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };

      course_modules: {
        Row: { id: string; course_id: string; title: string; description: string | null; order_index: number };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["course_modules"]["Insert"]>;
        Relationships: [];
      };

      course_lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          body: string | null;
          video_url: string | null;
          duration_minutes: number | null;
          order_index: number;
          status: ActiveStatus;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string | null;
          body?: string | null;
          video_url?: string | null;
          duration_minutes?: number | null;
          order_index?: number;
          status?: ActiveStatus;
        };
        Update: Partial<Database["public"]["Tables"]["course_lessons"]["Insert"]>;
        Relationships: [];
      };

      lesson_files: {
        Row: {
          id: string;
          lesson_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          order_index: number;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          name: string;
          storage_path: string;
          file_type: string;
          file_size: number;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_files"]["Insert"]>;
        Relationships: [];
      };

      lesson_progress: {
        Row: {
          id: string;
          teacher_id: string;
          lesson_id: string;
          started_at: string;
          completed_at: string | null;
          progress_percentage: number;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          lesson_id: string;
          started_at?: string;
          completed_at?: string | null;
          progress_percentage?: number;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Insert"]>;
        Relationships: [];
      };

      learning_objects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          cover_url: string | null;
          object_type: string;
          external_url: string | null;
          storage_path: string | null;
          access_type: ContentAccessType;
          status: ContentStatus;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          cover_url?: string | null;
          object_type: string;
          external_url?: string | null;
          storage_path?: string | null;
          access_type?: ContentAccessType;
          status?: ContentStatus;
          created_at?: string;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["learning_objects"]["Insert"]>;
        Relationships: [];
      };

      blog_categories: {
        Row: { id: string; name: string; slug: string; status: ActiveStatus };
        Insert: { id?: string; name: string; slug: string; status?: ActiveStatus };
        Update: Partial<{ id: string; name: string; slug: string; status: ActiveStatus }>;
        Relationships: [];
      };

      blog_posts: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          body: string | null;
          cover_url: string | null;
          author: string | null;
          status: ContentStatus;
          allow_comments: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          slug: string;
          excerpt?: string | null;
          body?: string | null;
          cover_url?: string | null;
          author?: string | null;
          status?: ContentStatus;
          allow_comments?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
        Relationships: [];
      };

      forum_categories: {
        Row: CatalogRow;
        Insert: CatalogInsert;
        Update: CatalogUpdate;
        Relationships: [];
      };

      forum_topics: {
        Row: {
          id: string;
          category_id: string;
          author_id: string;
          title: string;
          body: string;
          is_pinned: boolean;
          is_locked: boolean;
          status: ActiveStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          author_id: string;
          title: string;
          body: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          status?: ActiveStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forum_topics"]["Insert"]>;
        Relationships: [];
      };

      forum_replies: {
        Row: {
          id: string;
          topic_id: string;
          author_id: string;
          body: string;
          status: ActiveStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          author_id: string;
          body: string;
          status?: ActiveStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forum_replies"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      active_status: ActiveStatus;
      content_status: ContentStatus;
      content_access_type: ContentAccessType;
      content_difficulty: ContentDifficulty;
      billing_period: BillingPeriod;
      subscription_status: SubscriptionStatus;
    };
  };
};
