/**
 * Storage Adapter Interface
 *
 * All storage operations are SERVER-SIDE ONLY. Never import this module
 * (or its concrete implementations) from client components. Credentials are
 * read from environment variables at runtime and are never exposed to the
 * browser.
 */

// ---------------------------------------------------------------------------
// Shared value types
// ---------------------------------------------------------------------------

export interface UploadOptions {
  /** 'public'  → world-readable URL (default)
   *  'private' → accessible only via signed/authenticated requests */
  access?: 'public' | 'private';
  contentType?: string;
}

/** Canonical representation of a stored file returned by every adapter. */
export interface StoredFile {
  /** Publicly accessible URL (or a signed URL for private objects). */
  url: string;
  /**
   * Provider-internal key / path used to address the object
   * (e.g. "chat-images/user123/1234567890-photo.jpg").
   * Pass this to `delete()` and `getPresignedUploadUrl()`.
   */
  key: string;
  /** Size in bytes — populated by `list()`, optional elsewhere. */
  size?: number;
  /** ISO-8601 last-modified timestamp — populated by `list()`, optional elsewhere. */
  uploadedAt?: string;
}

export interface ListOptions {
  /** Filter results to objects whose key begins with this string. */
  prefix?: string;
  /** Maximum number of results to return (provider default if omitted). */
  limit?: number;
  /** Opaque cursor returned by a previous `list()` call for pagination. */
  cursor?: string;
}

export interface ListResult {
  files: StoredFile[];
  /** Pass to the next `list()` call to fetch the next page; undefined when done. */
  cursor?: string;
}

// ---------------------------------------------------------------------------
// The adapter contract
// ---------------------------------------------------------------------------

/**
 * Every cloud storage provider must implement this interface.
 *
 * Implementations live in:
 *   src/lib/storage/vercel.ts   ← @vercel/blob
 *   src/lib/storage/tencent.ts  ← cos-nodejs-sdk-v5
 *
 * The active adapter is selected by `CLOUD_PROVIDER` in:
 *   src/lib/storage/index.ts
 */
export interface StorageAdapter {
  /**
   * Server-side upload — stream or buffer the file through your Next.js
   * API route and into the provider.
   */
  upload(
    key: string,
    body: File | Buffer | Blob | ReadableStream,
    options?: UploadOptions,
  ): Promise<StoredFile>;

  /**
   * Permanently delete an object by its storage key.
   */
  delete(key: string): Promise<void>;

  /**
   * List objects, optionally filtered by prefix.
   */
  list(options?: ListOptions): Promise<ListResult>;
}
