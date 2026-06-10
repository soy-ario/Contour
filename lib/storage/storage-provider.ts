export interface StorageProvider {
  /**
   * Generates a signed/presigned URL that allows the client to upload a file directly.
   * @param key The unique key/path for the file in the bucket.
   * @param contentType Optional content type for S3-compatible endpoints.
   */
  getUploadSignedUrl(key: string, contentType?: string): Promise<string>;

  /**
   * Generates a signed/presigned URL for temporary read access to a private file.
   * @param key The key/path of the file in the bucket.
   * @param expiresInSeconds Duration of link validity in seconds. Defaults to 3600.
   */
  getReadSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Deletes a file from the storage bucket.
   * @param key The key/path of the file in the bucket.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Returns the public URL for a file in a public bucket.
   * @param key The key/path of the file in the bucket.
   */
  getPublicUrl(key: string): string;
}
