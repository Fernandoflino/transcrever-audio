import { logger } from '@utils/logger';
import type { VoiceMessageNode } from './types';
import {
  findChatPane,
  findMessageList,
  isMessageBubble,
  getMessageId,
  isVoiceBubble,
  SELECTORS,
} from './selectors';

export class WhatsAppAdapter {
  private processedMessages = new WeakSet<HTMLElement>();

  findVoiceMessageNodes(root: ParentNode = document): VoiceMessageNode[] {
    const bubbles = root.querySelectorAll<HTMLElement>(SELECTORS.messageBubble);
    const results: VoiceMessageNode[] = [];

    bubbles.forEach((bubble) => {
      if (!isVoiceBubble(bubble)) return;

      const messageId = getMessageId(bubble);
      if (!messageId) return;

      // Avoid processing the same message twice
      if (this.processedMessages.has(bubble)) return;

      const isOutgoing = bubble.getAttribute('data-ack') !== null;

      results.push({
        messageId,
        bubbleElement: bubble,
        isOutgoing,
      });

      this.processedMessages.add(bubble);
    });

    return results;
  }

  getMessageId(bubbleElement: HTMLElement): string | null {
    return getMessageId(bubbleElement);
  }

  isVoiceMessageBubble(element: HTMLElement): boolean {
    return isVoiceBubble(element);
  }

  injectBelowBubble(bubbleElement: HTMLElement): HTMLElement {
    // Check if we've already injected into this bubble
    const existingHost = bubbleElement.querySelector<HTMLElement>(
      '[data-transcrever-audio-host]'
    );
    if (existingHost) {
      return existingHost;
    }

    const host = document.createElement('div');
    host.setAttribute('data-transcrever-audio-host', '');
    host.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
      width: 100%;
    `;

    bubbleElement.appendChild(host);
    return host;
  }

  observe(onNewVoiceMessage: (node: VoiceMessageNode) => void): () => void {
    const messageList = findMessageList();
    if (!messageList) {
      logger.warn('Could not find message list; voice message detection may not work');
      return () => {};
    }

    // Initial scan
    const initialNodes = this.findVoiceMessageNodes(messageList);
    initialNodes.forEach((node) => {
      onNewVoiceMessage(node);
    });

    // Observe for new messages
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const newNodes = this.findVoiceMessageNodes(mutation.target as ParentNode);
          newNodes.forEach((node) => {
            onNewVoiceMessage(node);
          });
        }
      }
    });

    observer.observe(messageList, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      this.processedMessages = new WeakSet();
    };
  }
}
