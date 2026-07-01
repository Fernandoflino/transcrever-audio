import { logger } from '@utils/logger';

interface BridgeRequestMessage {
  source: 'transcrever-audio-content';
  type: 'GET_DECRYPTED_AUDIO';
  requestId: string;
  messageId: string;
}

interface BridgeResponseMessage {
  source: 'transcrever-audio-bridge';
  type: 'GET_DECRYPTED_AUDIO_RESULT';
  requestId: string;
  ok: boolean;
  blobUrl?: string;
  errorReason?: string;
}

class MainWorldBridgeClient {
  private pendingRequests = new Map<
    string,
    {
      resolve: (url: string | null) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor() {
    this.setupListener();
  }

  private setupListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const message = event.data as BridgeResponseMessage;
      if (message.source !== 'transcrever-audio-bridge') return;

      const pending = this.pendingRequests.get(message.requestId);
      if (!pending) return;

      this.pendingRequests.delete(message.requestId);
      clearTimeout(pending.timeout);

      if (message.ok && message.blobUrl) {
        pending.resolve(message.blobUrl);
      } else {
        pending.reject(
          new Error(message.errorReason || 'Bridge request failed')
        );
      }
    });
  }

  async getDecryptedAudioBlob(messageId: string): Promise<string | null> {
    const requestId = `bridge-${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Bridge request timeout'));
      }, 10000); // 10 second timeout

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const request: BridgeRequestMessage = {
        source: 'transcrever-audio-content',
        type: 'GET_DECRYPTED_AUDIO',
        requestId,
        messageId,
      };

      window.postMessage(request, '*');
    }).catch((error) => {
      logger.debug(`Bridge call failed for message ${messageId}:`, error);
      return null;
    });
  }
}

export const mainWorldBridgeClient = new MainWorldBridgeClient();
