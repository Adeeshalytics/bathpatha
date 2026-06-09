// Minimal hand-written Database types for the Supabase client.
// (Equivalent to what `supabase gen types typescript` would produce for this schema.)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          pin_hash: string | null;
          role: "admin" | "user";
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          pin_hash?: string | null;
          role?: "admin" | "user";
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          pin_hash?: string | null;
          role?: "admin" | "user";
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: number;
          breakfast_price: number;
          dinner_price: number;
          egg_price: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          breakfast_price?: number;
          dinner_price?: number;
          egg_price?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          breakfast_price?: number;
          dinner_price?: number;
          egg_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_records: {
        Row: {
          id: string;
          user_id: string;
          meal_type: "breakfast" | "dinner";
          meal_price: number;
          egg_count: number;
          egg_price: number;
          total_price: number;
          meal_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_type: "breakfast" | "dinner";
          meal_price: number;
          egg_count?: number;
          egg_price?: number;
          total_price: number;
          meal_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_type?: "breakfast" | "dinner";
          meal_price?: number;
          egg_count?: number;
          egg_price?: number;
          total_price?: number;
          meal_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          settled_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          settled_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          settled_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
