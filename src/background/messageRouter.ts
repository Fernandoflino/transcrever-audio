import { logger } from '@utils/logger';

export type ChromeMessage =
  | { type: 'TRANSCRIBE_AUDIO'; messageId: string; audioBase64: string; audioFormat: string }
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_SETTINGS'; settings: Record<string, unknown> };

export type ChromeMessageResponse = unknown;

export type MessageHandler = (
  message: ChromeMessage,
  sender: chrome.runtime.MessageSender
) => Promise<ChromeMessageResponse>;

export class MessageRouter {
  private handlers = new Map<string, MessageHandler>();

  registerHandler(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  async route(
    message: unknown,
    sender: chrome.runtime.MessageSender
  ): Promise<ChromeMessageResponse> {
    const msg = message as Record<string, unknown>;
    const type = msg.type as string;

    if (!type) {
      logger.warn('Received message without type');
      throw new Error('Message must have a type field');
    }

    const handler = this.handlers.get(type);
    if (!handler) {
      logger.warn(`No handler registered for message type: ${type}`);
      throw new Error(`Unknown message type: ${type}`);
    }

    logger.debug(`Routing message of type: ${type}`);
    return handler(msg as ChromeMessage, sender);
  }
}
