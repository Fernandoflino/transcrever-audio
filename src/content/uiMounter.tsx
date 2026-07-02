import React from 'react';
import ReactDOM from 'react-dom/client';
import { logger } from '@utils/logger';
import { TranscribeButton } from '@components/TranscribeButton';
import { TranscriptBubble } from '@components/TranscriptBubble';
import type { VoiceMessageNode } from '@adapter/types';
import type { MessageBubbleController, BubbleUIState } from './messageBubbleController';
import { WhatsAppAdapter } from '@adapter/WhatsAppAdapter';

const SHADOW_CSS = `
  :host {
    all: initial;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 13.5px;
    line-height: 1.45;
  }
  .ta-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 4px 0 2px;
  }

  /* Transcribe button — native WhatsApp look */
  .ta-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 5px 12px;
    border: none;
    border-radius: 14px;
    background: rgba(0, 168, 132, 0.14);
    color: #00a884;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease;
    -webkit-user-select: none;
    user-select: none;
  }
  .ta-btn:hover:not(:disabled) { background: rgba(0, 168, 132, 0.24); }
  .ta-btn:disabled { opacity: 0.7; cursor: default; }
  .ta-btn svg { width: 15px; height: 15px; }

  /* Spinner */
  .ta-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(0, 168, 132, 0.35);
    border-top-color: #00a884;
    border-radius: 50%;
    animation: ta-spin 0.7s linear infinite;
  }
  @keyframes ta-spin { to { transform: rotate(360deg); } }

  /* Transcript card */
  .ta-card {
    padding: 9px 12px;
    border-radius: 8px;
    border-left: 3px solid #00a884;
    background: #ffffff;
    color: #111b21;
    font-size: 13.5px;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(11, 20, 26, 0.16);
  }
  .ta-card.ta-loading {
    color: #667781;
    font-style: italic;
    border-left-color: #8696a0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ta-card.ta-error {
    border-left-color: #ea4335;
    color: #b02a24;
    background: #fdecea;
  }
  .ta-cache {
    font-size: 11px;
    color: #8696a0;
    padding-left: 2px;
  }
`;

interface BubbleUIProps {
  messageId: string;
  bubbleElement: HTMLElement;
  bubbleController: MessageBubbleController;
}

const BubbleUI: React.FC<BubbleUIProps> = ({
  messageId,
  bubbleElement,
  bubbleController,
}) => {
  const [state, setState] = React.useState<BubbleUIState>({
    messageId,
    status: 'idle',
    text: '',
    error: null,
    fromCache: false,
  });

  React.useEffect(() => {
    const unsubscribe = bubbleController.onStateChange(messageId, (newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [messageId, bubbleController]);

  const handleTranscribe = async () => {
    const node: VoiceMessageNode = {
      messageId,
      bubbleElement,
      isOutgoing: bubbleElement.getAttribute('data-ack') !== null,
    };
    await bubbleController.transcribe(node);
  };

  const showBubble =
    state.status === 'success' ||
    state.status === 'error' ||
    state.status === 'loading';

  return (
    <div className="ta-wrap">
      <TranscribeButton
        isLoading={state.status === 'loading'}
        onClick={handleTranscribe}
      />
      {showBubble && (
        <TranscriptBubble
          text={state.text}
          error={state.error || undefined}
          isLoading={state.status === 'loading'}
        />
      )}
      {state.status === 'success' && state.fromCache && (
        <div className="ta-cache">✓ do cache</div>
      )}
    </div>
  );
};

export function mountBubbleUI(
  node: VoiceMessageNode,
  bubbleController: MessageBubbleController
): void {
  try {
    const adapter = new WhatsAppAdapter();
    const host = adapter.injectBelowBubble(node.bubbleElement);

    // Attach a shadow root once so our styles never leak into WhatsApp's DOM.
    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = SHADOW_CSS;
      shadow.appendChild(style);

      const container = document.createElement('div');
      container.setAttribute('data-ta-container', '');
      shadow.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(
        <BubbleUI
          messageId={node.messageId}
          bubbleElement={node.bubbleElement}
          bubbleController={bubbleController}
        />
      );

      logger.log(`UI mounted for message ${node.messageId.slice(0, 16)}...`);
    }
  } catch (error) {
    logger.error(`Failed to mount UI for message ${node.messageId}:`, error);
  }
}
