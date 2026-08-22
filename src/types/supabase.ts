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
export type QuestionType =
  | "multiple_choice"
  | "essay"
  | "discursive"
  | "true_false"
  | "matching"
  | "fill_blank"
  | "ordering"
  | "argumentative"
  | "image_based"
  | "mixed";
export type BloomTaxonomyLevel = "lembrar" | "entender" | "aplicar" | "analisar" | "avaliar" | "criar";
export type RubricLevel = "full" | "partial" | "none";
export type QuestionImportStatus = "uploaded" | "processing" | "needs_review" | "approved" | "failed" | "rejected";
export type BillingPeriod = "free" | "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "canceled";
export type LearningActivityTypeDb =
  | "quiz"
  | "true_false"
  | "matching"
  | "memory"
  | "fill_blank"
  | "ordering"
  | "flashcards"
  | "simulation";

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
          is_owner: boolean;
          school_name: string | null;
          school_phone: string | null;
          school_logo_url: string | null;
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
          is_owner?: boolean;
          school_name?: string | null;
          school_phone?: string | null;
          school_logo_url?: string | null;
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
          is_owner?: boolean;
          school_name?: string | null;
          school_phone?: string | null;
          school_logo_url?: string | null;
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

      download_events: {
        Row: {
          id: string;
          teacher_id: string | null;
          resource_type: "material" | "question" | "exam" | "lesson";
          resource_id: string;
          resource_title: string;
          resource_href: string;
          file_name: string | null;
          downloaded_at: string;
        };
        Insert: {
          id?: string;
          teacher_id?: string | null;
          resource_type: "material" | "question" | "exam" | "lesson";
          resource_id: string;
          resource_title: string;
          resource_href: string;
          file_name?: string | null;
          downloaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["download_events"]["Insert"]>;
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
          exam_generation_monthly_limit: number | null;
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
          exam_generation_monthly_limit?: number | null;
          features?: string[];
          status?: ActiveStatus;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };

      site_settings: {
        Row: {
          id: boolean;
          support_email: string | null;
          maintenance_mode: boolean;
          maintenance_message: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          support_email?: string | null;
          maintenance_mode?: boolean;
          maintenance_message?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
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

      subscription_requests: {
        Row: {
          id: string;
          teacher_id: string;
          plan_id: string;
          status: "pending" | "approved" | "rejected" | "canceled";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          plan_id: string;
          status?: "pending" | "approved" | "rejected" | "canceled";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_requests"]["Insert"]>;
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

      questions: {
        Row: {
          id: string;
          statement: string;
          question_type: QuestionType;
          difficulty: ContentDifficulty;
          theme_id: string | null;
          subtheme_id: string | null;
          answer_key: string | null;
          status: ActiveStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          code: string | null;
          subject_id: string | null;
          grade_id: string | null;
          knowledge_objects: string[] | null;
          academic_period_id: string | null;
          book_name: string | null;
          book_unit: string | null;
          bloom_primary_level: BloomTaxonomyLevel | null;
          bloom_secondary_level: BloomTaxonomyLevel | null;
          bloom_justification: string | null;
          pedagogical_note: string | null;
          publication_status: ContentStatus;
          original_file_path: string | null;
          import_id: string | null;
          access_type: ContentAccessType;
          title: string | null;
        };
        Insert: {
          id?: string;
          statement: string;
          question_type?: QuestionType;
          difficulty?: ContentDifficulty;
          theme_id?: string | null;
          subtheme_id?: string | null;
          answer_key?: string | null;
          status?: ActiveStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          code?: string | null;
          subject_id?: string | null;
          grade_id?: string | null;
          knowledge_objects?: string[] | null;
          academic_period_id?: string | null;
          book_name?: string | null;
          book_unit?: string | null;
          bloom_primary_level?: BloomTaxonomyLevel | null;
          bloom_secondary_level?: BloomTaxonomyLevel | null;
          bloom_justification?: string | null;
          pedagogical_note?: string | null;
          publication_status?: ContentStatus;
          original_file_path?: string | null;
          import_id?: string | null;
          access_type?: ContentAccessType;
          title?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };

      academic_periods: {
        Row: CatalogRow;
        Insert: CatalogInsert;
        Update: CatalogUpdate;
        Relationships: [];
      };

      question_imports: {
        Row: {
          id: string;
          file_name: string;
          file_hash: string;
          storage_path: string;
          status: QuestionImportStatus;
          imported_by: string | null;
          question_id: string | null;
          extracted_code: string | null;
          error_message: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_hash: string;
          storage_path: string;
          status?: QuestionImportStatus;
          imported_by?: string | null;
          question_id?: string | null;
          extracted_code?: string | null;
          error_message?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["question_imports"]["Insert"]>;
        Relationships: [];
      };

      question_import_warnings: {
        Row: {
          id: string;
          import_id: string;
          severity: "warning" | "error";
          field: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          severity: "warning" | "error";
          field?: string | null;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_import_warnings"]["Insert"]>;
        Relationships: [];
      };

      question_bncc_skills: {
        Row: { id: string; question_id: string; bncc_skill_id: string };
        Insert: { id?: string; question_id: string; bncc_skill_id: string };
        Update: Partial<{ id: string; question_id: string; bncc_skill_id: string }>;
        Relationships: [];
      };

      question_parts: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          prompt: string;
          order_index: number;
          points: number | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          prompt: string;
          order_index?: number;
          points?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["question_parts"]["Insert"]>;
        Relationships: [];
      };

      question_answers: {
        Row: {
          id: string;
          question_id: string;
          question_part_id: string | null;
          expected_answer: string;
          correction_guidance: string | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          question_part_id?: string | null;
          expected_answer: string;
          correction_guidance?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["question_answers"]["Insert"]>;
        Relationships: [];
      };

      question_rubrics: {
        Row: {
          id: string;
          question_id: string;
          question_part_id: string | null;
          level: RubricLevel;
          points: number | null;
          criteria: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          question_part_id?: string | null;
          level: RubricLevel;
          points?: number | null;
          criteria: string;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["question_rubrics"]["Insert"]>;
        Relationships: [];
      };

      question_assets: {
        Row: {
          id: string;
          question_id: string;
          storage_path: string;
          asset_type: "image" | "table_image" | "other";
          original_name: string;
          mime_type: string;
          order_index: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          storage_path: string;
          asset_type: "image" | "table_image" | "other";
          original_name: string;
          mime_type: string;
          order_index?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_assets"]["Insert"]>;
        Relationships: [];
      };

      question_document_blocks: {
        Row: {
          id: string;
          question_id: string;
          section: "base_text" | "statement" | "correction" | "other";
          block_type: "heading" | "paragraph" | "image" | "table" | "list_item";
          content: unknown;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          section: "base_text" | "statement" | "correction" | "other";
          block_type: "heading" | "paragraph" | "image" | "table" | "list_item";
          content: unknown;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["question_document_blocks"]["Insert"]>;
        Relationships: [];
      };

      question_favorites: {
        Row: { id: string; teacher_id: string; question_id: string; created_at: string };
        Insert: { id?: string; teacher_id: string; question_id: string; created_at?: string };
        Update: Partial<{ id: string; teacher_id: string; question_id: string; created_at: string }>;
        Relationships: [];
      };

      question_collections: {
        Row: { id: string; teacher_id: string; name: string; created_at: string; updated_at: string };
        Insert: { id?: string; teacher_id: string; name: string; created_at?: string; updated_at?: string };
        Update: Partial<{ teacher_id: string; name: string; updated_at: string }>;
        Relationships: [];
      };

      question_collection_items: {
        Row: { id: string; collection_id: string; question_id: string; order_index: number; created_at: string };
        Insert: { id?: string; collection_id: string; question_id: string; order_index?: number; created_at?: string };
        Update: Partial<{ question_id: string; order_index: number }>;
        Relationships: [];
      };

      learning_object_favorites: {
        Row: { id: string; teacher_id: string; learning_object_id: string; created_at: string };
        Insert: { id?: string; teacher_id: string; learning_object_id: string; created_at?: string };
        Update: Partial<{ teacher_id: string; learning_object_id: string; created_at: string }>;
        Relationships: [];
      };

      question_alternatives: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          body: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          body: string;
          is_correct?: boolean;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["question_alternatives"]["Insert"]>;
        Relationships: [];
      };

      generated_exams: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          theme_id: string | null;
          grade_id: string | null;
          subject_id: string | null;
          school_name: string | null;
          instructions: string | null;
          show_answer_key: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          title: string;
          theme_id?: string | null;
          grade_id?: string | null;
          subject_id?: string | null;
          school_name?: string | null;
          instructions?: string | null;
          show_answer_key?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["generated_exams"]["Insert"]>;
        Relationships: [];
      };

      generated_exam_questions: {
        Row: { id: string; exam_id: string; question_id: string; order_index: number };
        Insert: { id?: string; exam_id: string; question_id: string; order_index?: number };
        Update: Partial<{ id: string; exam_id: string; question_id: string; order_index: number }>;
        Relationships: [];
      };

      // Log append-only de gerações de prova, usado só pra calcular a cota
      // mensal (getExamGenerationQuota) — apagar uma prova não libera cota,
      // diferente de contar linhas vivas em generated_exams.
      exam_generation_events: {
        Row: { id: string; teacher_id: string; exam_id: string | null; created_at: string };
        Insert: { id?: string; teacher_id: string; exam_id?: string | null; created_at?: string };
        Update: Partial<{ id: string; teacher_id: string; exam_id: string | null; created_at: string }>;
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
          activity_type: LearningActivityTypeDb | null;
          config: unknown;
          grade_id: string | null;
          subject_id: string | null;
          theme_id: string | null;
          subtheme_id: string | null;
          difficulty: ContentDifficulty | null;
          estimated_duration_minutes: number | null;
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
          activity_type?: LearningActivityTypeDb | null;
          config?: unknown;
          grade_id?: string | null;
          subject_id?: string | null;
          theme_id?: string | null;
          subtheme_id?: string | null;
          difficulty?: ContentDifficulty | null;
          estimated_duration_minutes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["learning_objects"]["Insert"]>;
        Relationships: [];
      };

      learning_object_bncc_skills: {
        Row: { id: string; learning_object_id: string; bncc_skill_id: string };
        Insert: { id?: string; learning_object_id: string; bncc_skill_id: string };
        Update: Partial<{ id: string; learning_object_id: string; bncc_skill_id: string }>;
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
      is_owner: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      create_generated_exam: {
        Args: {
          p_title: string;
          p_theme_id: string | null;
          p_school_name: string | null;
          p_instructions: string | null;
          p_show_answer_key: boolean;
          p_question_ids: string[];
          p_grade_id?: string | null;
          p_subject_id?: string | null;
        };
        Returns: string;
      };
      update_generated_exam: {
        Args: {
          p_exam_id: string;
          p_title: string;
          p_school_name: string | null;
          p_instructions: string | null;
          p_show_answer_key: boolean;
          p_question_ids: string[];
          p_grade_id?: string | null;
          p_subject_id?: string | null;
        };
        Returns: string;
      };
      create_question_collection: {
        Args: { p_name: string; p_question_ids: string[] };
        Returns: string;
      };
      update_question_collection: {
        Args: { p_collection_id: string; p_name: string; p_question_ids: string[] };
        Returns: string;
      };
      import_question_draft: {
        Args: {
          p_question_id: string;
          p_import_id: string;
          p_statement: string;
          p_question_type: QuestionType;
          p_difficulty: ContentDifficulty;
          p_code: string | null;
          p_subject_id: string | null;
          p_grade_id: string | null;
          p_knowledge_objects: string[] | null;
          p_academic_period_id: string | null;
          p_book_name: string | null;
          p_book_unit: string | null;
          p_bloom_primary_level: BloomTaxonomyLevel | null;
          p_bloom_justification: string | null;
          p_pedagogical_note: string | null;
          p_original_file_path: string | null;
          p_bncc_skill_ids: string[] | null;
          p_parts: unknown;
          p_answers: unknown;
          p_rubrics: unknown;
          p_assets: unknown;
          p_blocks: unknown;
          p_warnings: unknown;
        };
        Returns: string;
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
      learning_activity_type: LearningActivityTypeDb;
      question_type: QuestionType;
      bloom_taxonomy_level: BloomTaxonomyLevel;
      rubric_level: RubricLevel;
      question_import_status: QuestionImportStatus;
    };
  };
};
