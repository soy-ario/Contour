import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { StorageProvider } from "./storage-provider";

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient | null = null;

  private getSupabaseClient(): SupabaseClient {
    if (this.client) return this.client;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
      );
    }

    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    return this.client;
  }

  private getBucketName(): string {
    const bucket = process.env.SUPABASE_BUCKET_NAME;
    if (!bucket) {
      throw new Error("SUPABASE_BUCKET_NAME environment variable is not set");
    }
    return bucket;
  }

  async getUploadSignedUrl(key: string, contentType?: string): Promise<string> {
    const supabase = this.getSupabaseClient();
    const bucket = this.getBucketName();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(key);

    if (error) {
      throw new Error(`Failed to generate signed upload URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async getReadSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const supabase = this.getSupabaseClient();
    const bucket = this.getBucketName();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(key, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to generate signed read URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteObject(key: string): Promise<void> {
    const supabase = this.getSupabaseClient();
    const bucket = this.getBucketName();

    const { error } = await supabase.storage.from(bucket).remove([key]);

    if (error) {
      throw new Error(`Failed to delete storage object: ${error.message}`);
    }
  }

  getPublicUrl(key: string): string {
    const supabase = this.getSupabaseClient();
    const bucket = this.getBucketName();

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);

    return data.publicUrl;
  }
}
