import type { AudioExtractionContext, AudioExtractionOutcome, AudioExtractionStrategy } from '../types';
import { logger } from '@utils/logger';

export const domBlobStrategy: AudioExtractionStrategy = {
  name: 'DOM Blob',

  isApplicable(ctx: AudioExtractionContext): boolean {
    // Quick check: is there already an audio element with a blob: URL?
    const audioElement = ctx.bubbleElement.querySelector<HTMLAudioElement>(
      'audio[src^="blob:"]'
    );
    return !!audioElement;
  },

  async extract(ctx: AudioExtractionContext): Promise<AudioExtractionOutcome> {
    try {
      const audioElement = ctx.bubbleElement.querySelector<HTMLAudioElement>(
        'audio[src^="blob:"]'
      );

      if (!audioElement || !audioElement.src.startsWith('blob:')) {
        return {
          ok: false,
          strategyName: this.name,
          reason: 'No audio element with blob: URL found',
        };
      }

      const response = await fetch(audioElement.src);

      if (!response.ok) {
        return {
          ok: false,
          strategyName: this.name,
          reason: `Failed to fetch blob: HTTP ${response.status}`,
        };
      }

      const blob = await response.blob();

      return {
        ok: true,
        blob,
        mimeType: blob.type || 'audio/ogg',
        strategyName: this.name,
      };
    } catch (error) {
      return {
        ok: false,
        strategyName: this.name,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
