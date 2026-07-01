import { describe, it, expect, beforeEach } from 'vitest';
import { TranscriptionCacheService } from './TranscriptionCacheService';
import { clearDatabase } from './db';

describe('TranscriptionCacheService', () => {
  let service: TranscriptionCacheService;

  beforeEach(async () => {
    await clearDatabase();
    service = new TranscriptionCacheService();
  });

  it('should store and retrieve a transcript', async () => {
    const record = {
      hash: 'abc123',
      text: 'Hello world',
      model: 'openai/gpt-4o-mini-transcribe',
      createdAt: Date.now(),
    };

    await service.set(record);
    const retrieved = await service.get('abc123');

    expect(retrieved).toEqual(record);
  });

  it('should return undefined for non-existent hash', async () => {
    const result = await service.get('non-existent');
    expect(result).toBeUndefined();
  });

  it('should update an existing record', async () => {
    const record1 = {
      hash: 'key1',
      text: 'Original text',
      model: 'model1',
      createdAt: Date.now(),
    };

    await service.set(record1);

    const record2 = {
      hash: 'key1',
      text: 'Updated text',
      model: 'model2',
      createdAt: Date.now(),
    };

    await service.set(record2);
    const retrieved = await service.get('key1');

    expect(retrieved?.text).toBe('Updated text');
  });
});
