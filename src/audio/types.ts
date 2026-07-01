export interface AudioExtractionContext {
  messageId: string;
  bubbleElement: HTMLElement;
}

export interface AudioExtractionSuccess {
  ok: true;
  blob: Blob;
  mimeType: string;
  strategyName: string;
}

export interface AudioExtractionFailure {
  ok: false;
  strategyName: string;
  reason: string;
}

export type AudioExtractionOutcome = AudioExtractionSuccess | AudioExtractionFailure;

export interface AudioExtractionStrategy {
  readonly name: string;
  isApplicable(ctx: AudioExtractionContext): boolean;
  extract(ctx: AudioExtractionContext): Promise<AudioExtractionOutcome>;
}

export class AudioExtractionAllStrategiesFailedError extends Error {
  constructor(public readonly failures: AudioExtractionFailure[]) {
    super(
      `All audio extraction strategies failed: ${failures
        .map((f) => `${f.strategyName}: ${f.reason}`)
        .join('; ')}`
    );
    this.name = 'AudioExtractionAllStrategiesFailedError';
  }
}
