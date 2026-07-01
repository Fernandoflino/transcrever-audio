import { logger } from '@utils/logger';
import { createDefaultAudioExtractor } from '@audio/index';
import { blobToBase64 } from '@utils/base64';
import type { VoiceMessageNode } from '@adapter/types';

export interface BubbleUIState {
  messageId: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  text: string;
  error: string | null;
  fromCache: boolean;
}

export type BubbleUIUpdateCallback = (state: BubbleUIState) => void;

export class MessageBubbleController {
  private processedMessages = new WeakSet<HTMLElement>();
  private audioExtractor = createDefaultAudioExtractor();
  private stateCallbacks = new Map<string, BubbleUIUpdateCallback[]>();

  isProcessed(bubbleElement: HTMLElement): boolean {
    return this.processedMessages.has(bubbleElement);
  }

  markProcessed(bubbleElement: HTMLElement): void {
    this.processedMessages.add(bubbleElement);
  }

  onStateChange(messageId: string, callback: BubbleUIUpdateCallback): () => void {
    if (!this.stateCallbacks.has(messageId)) {
      this.stateCallbacks.set(messageId, []);
    }
    this.stateCallbacks.get(messageId)!.push(callback);

    return () => {
      const callbacks = this.stateCallbacks.get(messageId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emitStateChange(state: BubbleUIState): void {
    const callbacks = this.stateCallbacks.get(state.messageId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(state));
    }
  }

  async transcribe(node: VoiceMessageNode): Promise<void> {
    const { messageId, bubbleElement } = node;

    try {
      // Emit loading state
      this.emitStateChange({
        messageId,
        status: 'loading',
        text: '',
        error: null,
        fromCache: false,
      });

      logger.log(`Extracting audio for message ${messageId.slice(0, 16)}...`);

      // Extract audio using strategy chain
      const extractionResult = await this.audioExtractor.extract({
        messageId,
        bubbleElement,
      });

      if (!extractionResult.ok) {
        throw new Error(`Audio extraction failed: ${extractionResult.reason}`);
      }

      logger.log(
        `Audio extracted via "${extractionResult.strategyName}" (${extractionResult.blob.size} bytes)`
      );

      // Convert to base64
      const audioBase64 = await blobToBase64(extractionResult.blob);

      // Determine format from mimetype
      let audioFormat: 'ogg' | 'mp3' | 'wav' = 'ogg';
      if (extractionResult.mimeType.includes('mp3')) {
        audioFormat = 'mp3';
      } else if (extractionResult.mimeType.includes('wav')) {
        audioFormat = 'wav';
      }

      logger.log(`Requesting transcription (format: ${audioFormat})...`);

      // Send to background for transcription
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSCRIBE_AUDIO',
        messageId,
        audioBase64,
        audioFormat,
      });

      if (response.ok) {
        this.emitStateChange({
          messageId,
          status: 'success',
          text: response.text,
          error: null,
          fromCache: response.fromCache,
        });
        logger.log(`Transcription successful (fromCache: ${response.fromCache})`);
      } else {
        const errorMsg = response.errorMessage || 'Unknown error';
        this.emitStateChange({
          messageId,
          status: 'error',
          text: '',
          error: errorMsg,
          fromCache: false,
        });
        logger.warn(`Transcription failed: ${response.errorCode} - ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.emitStateChange({
        messageId,
        status: 'error',
        text: '',
        error: errorMsg,
        fromCache: false,
      });
      logger.error(`Error transcribing message ${messageId.slice(0, 16)}:`, error);
    }
  }
}
