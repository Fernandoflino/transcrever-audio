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

  // Waveform canvas indicator (present in voice messages)
  waveformCanvas: 'canvas',
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
  // Check for presence of audio player or waveform canvas
  // (these are strong indicators of a voice message)
  const hasAudio = element.querySelector(SELECTORS.audioPlayer) !== null;
  const hasWaveform = element.querySelector(SELECTORS.waveformCanvas) !== null;
  return hasAudio || hasWaveform;
}
