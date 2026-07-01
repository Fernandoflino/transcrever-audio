import { logger } from '@utils/logger';
import { OpenRouterService } from '@api/OpenRouterService';
import { TranscriptionCacheService } from '@storage/TranscriptionCacheService';
import { sha256 } from './hashService';
import type { SupportedAudioFormat } from '@api/types';

export class TranscriptionService {
  constructor(
    private openRouterService: OpenRouterService,
    private cacheService: TranscriptionCacheService,
    private settings: { apiKey: string; model: string; language?: string }
  ) {}

  async transcribe(
    audioBase64: string,
    audioFormat: SupportedAudioFormat
  ): Promise<{ text: string; fromCache: boolean }> {
    // Decode base64 to get raw bytes for hashing
    const arrayBuffer = this.base64ToArrayBuffer(audioBase64);
    const hash = await sha256(arrayBuffer);

    // Check cache first
    const cached = await this.cacheService.get(hash);
    if (cached) {
      logger.log(`Cache hit for hash ${hash.slice(0, 8)}...`);
      return { text: cached.text, fromCache: true };
    }

    logger.log(`Cache miss for hash ${hash.slice(0, 8)}..., transcribing...`);

    // Call OpenRouter API
    const result = await this.openRouterService.transcribe(
      { base64Data: audioBase64, format: audioFormat },
      {
        apiKey: this.settings.apiKey,
        model: this.settings.model,
        language: this.settings.language,
      }
    );

    // Cache the result
    await this.cacheService.set({
      hash,
      text: result.text,
      model: this.settings.model,
      language: this.settings.language,
      createdAt: Date.now(),
    });

    logger.log(`Successfully transcribed and cached hash ${hash.slice(0, 8)}...`);

    return { text: result.text, fromCache: false };
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
