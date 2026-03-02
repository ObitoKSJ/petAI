/**
 * Minimal type declarations for cos-nodejs-sdk-v5.
 * The package ships no bundled types; this file covers only the
 * methods used by src/lib/storage/tencent.ts.
 *
 * Extend as needed when you use additional COS SDK features.
 */

declare module 'cos-nodejs-sdk-v5' {
  interface COSOptions {
    SecretId: string;
    SecretKey: string;
    /** Security token for temporary credentials (STS). */
    SecurityToken?: string;
    /** Timeout in milliseconds. */
    Timeout?: number;
    /** Route all requests through the global acceleration endpoint
     *  (cos.accelerate.myqcloud.com). Bucket must have acceleration enabled. */
    UseAccelerate?: boolean;
  }

  // --------------------------------------------------------------------------
  // putObject
  // --------------------------------------------------------------------------

  interface PutObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
    Body: Buffer | ReadableStream | string | Blob;
    ContentType?: string;
    ContentLength?: number;
    /** COS ACL string, e.g. 'public-read' | 'private'. */
    ACL?: string;
  }

  interface PutObjectResult {
    ETag: string;
    Location: string;
    statusCode: number;
  }

  // --------------------------------------------------------------------------
  // deleteObject
  // --------------------------------------------------------------------------

  interface DeleteObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }

  // --------------------------------------------------------------------------
  // getBucket (list objects)
  // --------------------------------------------------------------------------

  interface GetBucketParams {
    Bucket: string;
    Region: string;
    Prefix?: string;
    Delimiter?: string;
    MaxKeys?: number;
    Marker?: string;
  }

  export interface BucketObject {
    Key: string;
    LastModified: string;
    ETag: string;
    Size: string;
    Owner?: { ID: string; DisplayName: string };
    StorageClass: string;
  }

  export interface GetBucketResult {
    Name: string;
    Prefix: string;
    Marker: string;
    NextMarker: string;
    MaxKeys: string;
    IsTruncated: 'true' | 'false';
    Contents: BucketObject[];
  }

  // --------------------------------------------------------------------------
  // COS class
  // --------------------------------------------------------------------------

  type Callback<T = Record<string, never>> = (err: Error | null, data: T) => void;

  class COS {
    constructor(options: COSOptions);

    putObject(params: PutObjectParams, callback: (err: Error | null, data: PutObjectResult) => void): void;
    deleteObject(params: DeleteObjectParams, callback: (err: Error | null) => void): void;
    getBucket(params: GetBucketParams, callback: Callback<GetBucketResult>): void;
  }

  export default COS;
}
