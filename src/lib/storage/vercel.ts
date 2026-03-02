/**
 * Vercel Blob Storage Adapter
 *
 * SERVER-SIDE ONLY. Never import from a Client Component.
 *
 * Required env vars (set in Vercel dashboard / .env.local):
 *   BLOB_READ_WRITE_TOKEN   — issued by Vercel Blob
 */

import { put, del, list as blobList } from '@vercel/blob';
import type {
  StorageAdapter,
  StoredFile,
  UploadOptions,
  ListOptions,
  ListResult,
} from './types';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function toPublicUrl(blobUrl: string): string {
  return blobUrl;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class VercelStorageAdapter implements StorageAdapter {
  // -------------------------------------------------------------------------
  // upload
  // -------------------------------------------------------------------------
  async upload(
    key: string,
    body: File | Buffer | Blob | ReadableStream,
    options: UploadOptions = {},
  ): Promise<StoredFile> {
    const blob = await put(key, body, {
      access: options.access ?? 'public',
      contentType: options.contentType,
    });

    return {
      url: toPublicUrl(blob.url),
      key,
    };
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  async delete(key: string): Promise<void> {
    // Vercel Blob's `del` accepts either a URL or an array of URLs.
    // We store keys that are the full Vercel CDN URL, so pass `key` directly.
    await del(key);
  }

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  async list(options: ListOptions = {}): Promise<ListResult> {
    const result = await blobList({
      prefix: options.prefix,
      limit: options.limit,
      cursor: options.cursor,
    });

    return {
      files: result.blobs.map((b) => ({
        url: toPublicUrl(b.url),
        key: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt ? new Date(b.uploadedAt).toISOString() : undefined,
      })),
      cursor: result.cursor,
    };
  }

}
