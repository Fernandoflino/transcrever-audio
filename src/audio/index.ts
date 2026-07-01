export { AudioExtractor } from './AudioExtractor';
export { type AudioExtractionContext, type AudioExtractionSuccess, type AudioExtractionFailure, type AudioExtractionStrategy, AudioExtractionAllStrategiesFailedError } from './types';
export { domBlobStrategy } from './strategies/domBlobStrategy';
export { internalBridgeStrategy } from './strategies/internalBridgeStrategy';
export { networkInterceptStrategy } from './strategies/networkInterceptStrategy.stub';

import { AudioExtractor } from './AudioExtractor';
import { domBlobStrategy } from './strategies/domBlobStrategy';
import { internalBridgeStrategy } from './strategies/internalBridgeStrategy';

export function createDefaultAudioExtractor(): AudioExtractor {
  return new AudioExtractor([domBlobStrategy, internalBridgeStrategy]);
}
