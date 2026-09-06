import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VITE_SUPABASE_URL, VITE_SUPABASE_KEY } from "../common/conts/env";

export type SupabaseResponse<T> = {
  data?: T | null;
  error?: Error | null;
};

export type GenericDatabase = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: any[];
      }
    >;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
};

export class SupabaseService<DB extends GenericDatabase = GenericDatabase> {
  private service: SupabaseClient<DB>;

  constructor() {
    this.service = createClient<DB>(VITE_SUPABASE_URL, VITE_SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  async getData<TName extends keyof DB["public"]["Tables"] & string>(
    tableName: TName,
    select: string = "*",
  ) {
    try {
      const { data, error } = await this.service.from(tableName).select(select);

      return { data, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  }

  async insertData<TName extends keyof DB["public"]["Tables"] & string>(
    tableName: TName,
    data: DB["public"]["Tables"][TName]["Insert"],
  ) {
    const { data: insertedData, error } = await this.service
      .from(tableName)
      .insert(data as any);

    return { data: insertedData, error };
  }

  async updateData<TName extends keyof DB["public"]["Tables"] & string>(
    id: string | number,
    tableName: TName,
    data: DB["public"]["Tables"][TName]["Update"],
  ) {
    const { data: updatedData, error } = await (
      this.service.from(tableName as string) as any
    )
      .update(data)
      .eq("id", id);

    return { data: updatedData, error };
  }
  async deleteData<TName extends keyof DB["public"]["Tables"] & string>(
    id: string | number,
    tableName: TName,
  ) {
    const { data: deletedData, error } = await (
      this.service.from(tableName as string) as any
    )
      .delete()
      .eq("id", id);

    return { data: deletedData, error };
  }
}