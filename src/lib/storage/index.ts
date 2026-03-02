/**
 * Storage Adapter Factory
 *
 * SERVER-SIDE ONLY. Re-exports the concrete adapter that matches the
 * runtime environment without leaking any provider SDK to the client bundle.
 *
 * Configuration:
 *   CLOUD_PROVIDER=vercel   → uses @vercel/blob  (default)
 *   CLOUD_PROVIDER=tencent  → uses cos-nodejs-sdk-v5
 *
 * Usage inside API routes / Server Actions:
 *   import { storage } from '@/lib/storage';
 *   const file = await storage.upload('chat-images/user/photo.jpg', body);
 *
 * The `storage` singleton is created once per server process. Dynamic
 * `import()` is used so that only the active provider's SDK is included in
 * the server bundle — avoiding loading Tencent COS on Vercel, or Vercel Blob
 * on Tencent Cloud.
 */

import type { StorageAdapter } from './types';

export type { StorageAdapter, StoredFile, UploadOptions, ListOptions, ListResult } from './types';

// ---------------------------------------------------------------------------
// Singleton — resolved lazily at runtime, not at module load time.
// This keeps the cold-start cost low and decouples the factory from the
// heavy provider SDKs until the first call.
// ---------------------------------------------------------------------------

let _adapter: StorageAdapter | null = null;

async function resolveAdapter(): Promise<StorageAdapter> {
  if (_adapter) return _adapter;

  const provider = (process.env.CLOUD_PROVIDER ?? 'vercel').toLowerCase();

  switch (provider) {
    case 'tencent': {
      const { TencentStorageAdapter } = await import('./tencent');
      _adapter = new TencentStorageAdapter();
      break;
    }
    case 'vercel':
    default: {
      const { VercelStorageAdapter } = await import('./vercel');
      _adapter = new VercelStorageAdapter();
      break;
    }
  }

  return _adapter;
}

// ---------------------------------------------------------------------------
// Synchronous-style proxy
//
// Most call sites don't want to await a factory call before every operation.
// This Proxy transparently awaits `resolveAdapter()` before forwarding any
// method call, keeping consumer code clean:
//
//   const file = await storage.upload(key, body);  // ✓  — no factory await
// ---------------------------------------------------------------------------

function createStorageProxy(): StorageAdapter {
  return new Proxy({} as StorageAdapter, {
    get(_target, prop: string) {
      return async (...args: unknown[]) => {
        const adapter = await resolveAdapter();
        const method = (adapter as unknown as Record<string, (...a: unknown[]) => unknown>)[prop];
        if (typeof method !== 'function') {
          throw new TypeError(`storage.${prop} is not a function`);
        }
        return method.apply(adapter, args);
      };
    },
  });
}

/**
 * The active storage adapter instance.
 *
 * Import this wherever you need to interact with file storage on the server.
 * The correct provider is selected automatically based on `CLOUD_PROVIDER`.
 *
 * @example
 * import { storage } from '@/lib/storage';
 *
 * // Upload from an API route
 * const stored = await storage.upload(`chat-images/${userId}/${filename}`, file);
 * return NextResponse.json({ url: stored.url });
 *
 * // Generate a pre-signed URL for direct browser upload
 * const presignedUrl = await storage.getPresignedUploadUrl(`chat-images/${userId}/${filename}`);
 * return NextResponse.json({ presignedUrl });
 *
 * // Delete a file
 * await storage.delete(key);
 */
export const storage: StorageAdapter = createStorageProxy();
