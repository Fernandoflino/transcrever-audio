import { getTranscript, addTranscript } from './db';
import type { CachedTranscriptRecord } from './types';

export class TranscriptionCacheService {
  async get(hash: string): Promise<CachedTranscriptRecord | undefined> {
    return getTranscript(hash);
  }

  async set(record: CachedTranscriptRecord): Promise<void> {
    return addTranscript(record);
  }
}
