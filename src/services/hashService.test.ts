import { describe, it, expect } from 'vitest';
import { sha256, hashBlob } from './hashService';

describe('hashService', () => {
  describe('sha256', () => {
    it('should hash a buffer deterministically', async () => {
      const buffer = new TextEncoder().encode('hello world');
      const hash1 = await sha256(buffer);
      const hash2 = await sha256(buffer);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex is 64 chars
    });

    it('should produce different hashes for different inputs', async () => {
      const buffer1 = new TextEncoder().encode('hello');
      const buffer2 = new TextEncoder().encode('world');

      const hash1 = await sha256(buffer1);
      const hash2 = await sha256(buffer2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashBlob', () => {
    it('should hash a blob deterministically', async () => {
      const blob1 = new Blob(['test data']);
      const blob2 = new Blob(['test data']);

      const hash1 = await hashBlob(blob1);
      const hash2 = await hashBlob(blob2);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different blobs', async () => {
      const blob1 = new Blob(['test']);
      const blob2 = new Blob(['different']);

      const hash1 = await hashBlob(blob1);
      const hash2 = await hashBlob(blob2);

      expect(hash1).not.toBe(hash2);
    });
  });
});
