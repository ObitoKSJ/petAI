/**
 * Tencent Cloud Object Storage (COS) Adapter
 *
 * SERVER-SIDE ONLY. Never import from a Client Component.
 *
 * Required env vars (set in Tencent deployment environment / .env.tencent.local):
 *   TENCENT_SECRET_ID    — COS API secret ID
 *   TENCENT_SECRET_KEY   — COS API secret key
 *   TENCENT_BUCKET       — Bucket name including AppID, e.g. my-bucket-125xxxxxx
 *   TENCENT_REGION       — COS region, e.g. ap-guangzhou | ap-beijing | ap-shanghai
 *   TENCENT_ACCELERATE   — Set to 'true' to use the global acceleration endpoint
 *                          (cos.accelerate.myqcloud.com). Requires the bucket to
 *                          have global acceleration enabled in the COS console.
 */

import COS, { type GetBucketResult, type BucketObject } from 'cos-nodejs-sdk-v5';
import type {
  StorageAdapter,
  StoredFile,
  UploadOptions,
  ListOptions,
  ListResult,
} from './types';

// ---------------------------------------------------------------------------
// Lazy singleton — the COS client is instantiated once on first use so that
// importing this module in test environments without credentials does not
// immediately throw.
// ---------------------------------------------------------------------------

let _cos: COS | null = null;

function getClient(): COS {
  if (_cos) return _cos;

  const SecretId = process.env.TENCENT_SECRET_ID;
  const SecretKey = process.env.TENCENT_SECRET_KEY;

  if (!SecretId || !SecretKey) {
    throw new Error(
      'Tencent COS credentials are not configured. ' +
        'Set TENCENT_SECRET_ID and TENCENT_SECRET_KEY environment variables.',
    );
  }

  _cos = new COS({ SecretId, SecretKey, UseAccelerate: isAccelerateEnabled() });
  return _cos;
}

function getConfig(): { Bucket: string; Region: string } {
  const Bucket = process.env.TENCENT_BUCKET;
  const Region = process.env.TENCENT_REGION;

  if (!Bucket || !Region) {
    throw new Error(
      'Tencent COS bucket config is not set. ' +
        'Set TENCENT_BUCKET and TENCENT_REGION environment variables.',
    );
  }

  return { Bucket, Region };
}

function isAccelerateEnabled(): boolean {
  return process.env.TENCENT_ACCELERATE === 'true';
}

/** Construct the public HTTPS URL for an object key. */
function buildPublicUrl(key: string): string {
  const { Bucket } = getConfig();
  if (isAccelerateEnabled()) {
    // Global acceleration endpoint — region-agnostic, lowest latency worldwide
    return `https://${Bucket}.cos.accelerate.myqcloud.com/${key}`;
  }
  const { Region } = getConfig();
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class TencentStorageAdapter implements StorageAdapter {
  // -------------------------------------------------------------------------
  // upload
  // -------------------------------------------------------------------------
  async upload(
    key: string,
    body: File | Buffer | Blob | ReadableStream,
    options: UploadOptions = {},
  ): Promise<StoredFile> {
    const cos = getClient();
    const { Bucket, Region } = getConfig();

    // cos-nodejs-sdk-v5 accepts Buffer/string/stream for Body
    let bodyBuffer: Buffer | Blob | ReadableStream;
    if (body instanceof File) {
      bodyBuffer = Buffer.from(await body.arrayBuffer());
    } else {
      bodyBuffer = body;
    }

    await new Promise<void>((resolve, reject) => {
      cos.putObject(
        {
          Bucket,
          Region,
          Key: key,
          Body: bodyBuffer as Buffer,
          ContentType: options.contentType,
          // COS ACL: 'public-read' = world URL-readable; 'private' = signed only
          ACL: options.access === 'private' ? 'private' : 'public-read',
        },
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });

    return {
      url: buildPublicUrl(key),
      key,
    };
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  async delete(key: string): Promise<void> {
    const cos = getClient();
    const { Bucket, Region } = getConfig();

    await new Promise<void>((resolve, reject) => {
      cos.deleteObject({ Bucket, Region, Key: key }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  async list(options: ListOptions = {}): Promise<ListResult> {
    const cos = getClient();
    const { Bucket, Region } = getConfig();

    const result = await new Promise<GetBucketResult>((resolve, reject) => {
      cos.getBucket(
        {
          Bucket,
          Region,
          Prefix: options.prefix ?? '',
          MaxKeys: options.limit,
          Marker: options.cursor,
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        },
      );
    });

    const files: StoredFile[] = result.Contents.map((item: BucketObject) => ({
      url: buildPublicUrl(item.Key),
      key: item.Key,
      size: Number(item.Size),
      uploadedAt: item.LastModified,
    }));

    return {
      files,
      // COS uses NextMarker for pagination; only present when IsTruncated === 'true'
      cursor: result.IsTruncated === 'true' ? result.NextMarker : undefined,
    };
  }

}
