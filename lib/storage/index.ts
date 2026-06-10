import { StorageProvider } from "./storage-provider";
import { SupabaseStorageProvider } from "./supabase-storage";
import { R2StorageProvider } from "./r2-storage";

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "SUPABASE";

  switch (provider.toUpperCase()) {
    case "R2":
      return new R2StorageProvider();
    case "SUPABASE":
    default:
      return new SupabaseStorageProvider();
  }
}

export const storageProvider = createStorageProvider();
export type { StorageProvider };
export { R2StorageProvider } from "./r2-storage";
export { SupabaseStorageProvider } from "./supabase-storage";
