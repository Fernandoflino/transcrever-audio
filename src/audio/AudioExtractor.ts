import { logger } from '@utils/logger';
import type {
  AudioExtractionContext,
  AudioExtractionSuccess,
  AudioExtractionStrategy,
} from './types';
import { AudioExtractionAllStrategiesFailedError } from './types';

export class AudioExtractor {
  constructor(
    private readonly strategies: readonly AudioExtractionStrategy[]
  ) {}

  async extract(ctx: AudioExtractionContext): Promise<AudioExtractionSuccess> {
    const failures = [];

    for (const strategy of this.strategies) {
      if (!strategy.isApplicable(ctx)) {
        logger.debug(`Strategy "${strategy.name}" not applicable for message ${ctx.messageId}`);
        continue;
      }

      logger.debug(`Trying strategy "${strategy.name}" for message ${ctx.messageId}`);

      try {
        const outcome = await strategy.extract(ctx);

        if (outcome.ok) {
          logger.log(
            `Successfully extracted audio via "${outcome.strategyName}" for message ${ctx.messageId}`
          );
          return outcome;
        }

        logger.debug(
          `Strategy "${outcome.strategyName}" failed: ${outcome.reason}`
        );
        failures.push(outcome);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        failures.push({
          ok: false,
          strategyName: strategy.name,
          reason,
        });
        logger.debug(`Strategy "${strategy.name}" threw error: ${reason}`);
      }
    }

    throw new AudioExtractionAllStrategiesFailedError(failures);
  }
}
