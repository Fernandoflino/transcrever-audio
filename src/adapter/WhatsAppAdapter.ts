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

    let voiceCount = 0;
    bubbles.forEach((bubble) => {
      if (!isVoiceBubble(bubble)) return;
      voiceCount++;

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

    if (bubbles.length > 0) {
      logger.log(
        `Scanned ${bubbles.length} bubbles, ${voiceCount} look like voice notes, ${results.length} new`
      );
    }

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
    // Anchor on a STABLE root that survives chat switches. WhatsApp replaces
    // #main entirely when you open another conversation, so observing #main
    // would leave us orphaned. #app (fallback: body) never gets replaced.
    const root =
      document.getElementById('app') ?? document.body ?? document.documentElement;

    // Scan the WHOLE document for voice notes (not just the changed subtree):
    // voice-note markers live deep inside a bubble whose data-id is on an
    // ancestor, and this also naturally handles chat navigation + scrollback.
    const scanAll = () => {
      const nodes = this.findVoiceMessageNodes(document);
      nodes.forEach((node) => onNewVoiceMessage(node));
    };

    // Initial scan
    scanAll();

    // Throttle (NOT debounce): WhatsApp mutates #app constantly, so a debounce
    // that resets on every mutation would starve and never fire. This guarantees
    // scanAll runs ~every 400ms while the page is active, then stops when quiet.
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        scanAll();
      }, 400);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      this.processedMessages = new WeakSet();
    };
  }
}
