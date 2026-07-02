// Centralized, resilient selectors for WhatsApp Web DOM
// Prefer data-*, aria-label, role attributes over fragile CSS class names

export const SELECTORS = {
  // Chat pane root container (MOST STABLE)
  chatPane: '#main',

  // Message bubble container (data-id is highly stable)
  messageBubble: '[data-id]',

  // Media element (generic, for both audio/video/image)
  mediaElement: 'audio, video, img[src^="blob:"]',

  // Audio player specifically
  audioPlayer: 'audio',

  // Waveform canvas indicator (present in some voice messages)
  waveformCanvas: 'canvas',

  // Voice-message-specific markers (resilient to WhatsApp updates).
  // Voice notes ("ptt") expose a play/pause button and a scrubber slider
  // even before the <audio> element is lazily created.
  voiceIndicators: [
    '[data-icon="audio-play"]',
    '[data-icon="audio-pause"]',
    '[data-icon="ptt"]',
    'button[aria-label*="voice message" i]',
    'button[aria-label*="mensagem de voz" i]',
    'button[aria-label*="Reproduzir" i]',
    'button[aria-label*="Play" i]',
    'span[data-icon="audio-play"]',
    'input[type="range"]',
    'audio',
    'canvas',
  ].join(', '),
};

export function findChatPane(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SELECTORS.chatPane);
}

/**
 * Find the message list container.
 * Since WhatsApp Web's structure is volatile, we return the chat pane itself
 * and use MutationObserver on it to detect new messages.
 * This is more resilient than trying to find a specific message list div.
 */
export function findMessageList(): HTMLElement | null {
  // Return the main pane, which contains all messages
  // The MutationObserver will scan it for new [data-id] elements
  return findChatPane();
}

export function isMessageBubble(element: Element): element is HTMLElement {
  return element.hasAttribute('data-id');
}

export function getMessageId(element: HTMLElement): string | null {
  return element.getAttribute('data-id');
}

export function isVoiceBubble(element: HTMLElement): boolean {
  // Voice notes ("ptt") expose a play/pause button and a scrubber slider
  // even before the <audio> element is lazily created after first playback.
  // We check a broad set of resilient markers instead of relying on <audio>.
  return element.querySelector(SELECTORS.voiceIndicators) !== null;
}
