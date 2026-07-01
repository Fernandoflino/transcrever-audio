import type { AudioExtractionContext, AudioExtractionOutcome, AudioExtractionStrategy } from '../types';
import { mainWorldBridgeClient } from '@content/mainWorldBridgeClient';

export const internalBridgeStrategy: AudioExtractionStrategy = {
  name: 'Internal Bridge',

  isApplicable(): boolean {
    // Always applicable as a fallback, but may fail at runtime
    return true;
  },

  async extract(ctx: AudioExtractionContext): Promise<AudioExtractionOutcome> {
    try {
      const blobUrl = await mainWorldBridgeClient.getDecryptedAudioBlob(ctx.messageId);

      if (!blobUrl) {
        return {
          ok: false,
          strategyName: this.name,
          reason: 'Bridge returned null blob URL',
        };
      }

      const response = await fetch(blobUrl);

      if (!response.ok) {
        return {
          ok: false,
          strategyName: this.name,
          reason: `Failed to fetch blob from bridge: HTTP ${response.status}`,
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
