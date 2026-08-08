export type StoredObject = {
  /** Public HTTPS URL stored on Asset.url */
  url: string;
  /** Object key / relative path used for deletes */
  key: string;
};

export type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
  contentLength: number;
};

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface ObjectStorage {
  readonly driver: 'local' | 'r2';
  upload(input: UploadObjectInput): Promise<StoredObject>;
  delete(keyOrUrl: string): Promise<void>;
  isManagedUrl(url: string): boolean;
}
