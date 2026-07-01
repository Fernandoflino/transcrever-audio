import type { AudioExtractionContext, AudioExtractionOutcome, AudioExtractionStrategy } from '../types';

export const networkInterceptStrategy: AudioExtractionStrategy = {
  name: 'Network Intercept',

  isApplicable(): boolean {
    // Not implemented yet; always return false to skip this strategy
    return false;
  },

  async extract(): Promise<AudioExtractionOutcome> {
    return {
      ok: false,
      strategyName: this.name,
      reason: 'Strategy not implemented yet. This is a future extension point.',
    };
  },
};
