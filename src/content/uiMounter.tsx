import React from 'react';
import ReactDOM from 'react-dom';
import { logger } from '@utils/logger';
import { TranscribeButton } from '@components/TranscribeButton';
import { TranscriptBubble } from '@components/TranscriptBubble';
import { ShadowRoot } from '@components/ShadowRoot';
import type { VoiceMessageNode } from '@adapter/types';
import type { MessageBubbleController, BubbleUIState } from './messageBubbleController';
import { WhatsAppAdapter } from '@adapter/WhatsAppAdapter';

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

  const [isCreatingHost, setIsCreatingHost] = React.useState(true);
  const hostRef = React.useRef<HTMLElement | null>(null);

  // Subscribe to state changes
  React.useEffect(() => {
    const unsubscribe = bubbleController.onStateChange(messageId, (newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [messageId, bubbleController]);

  // Create or get the host element
  React.useEffect(() => {
    try {
      const adapter = new WhatsAppAdapter();
      const host = adapter.injectBelowBubble(bubbleElement);
      hostRef.current = host;
      setIsCreatingHost(false);
    } catch (error) {
      logger.error('Failed to inject host element:', error);
      setIsCreatingHost(false);
    }
  }, [bubbleElement]);

  const handleTranscribe = async () => {
    // Get the node info to pass to bubbleController
    const node: VoiceMessageNode = {
      messageId,
      bubbleElement,
      isOutgoing: bubbleElement.getAttribute('data-ack') !== null,
    };

    await bubbleController.transcribe(node);
  };

  if (isCreatingHost || !hostRef.current) {
    return null;
  }

  return (
    <ShadowRoot hostElement={hostRef.current}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <TranscribeButton
          isLoading={state.status === 'loading'}
          onClick={handleTranscribe}
        />
        {(state.status === 'success' || state.status === 'error' || state.status === 'loading') && (
          <TranscriptBubble
            text={state.text}
            error={state.error || undefined}
            isLoading={state.status === 'loading'}
          />
        )}
        {state.status === 'success' && state.fromCache && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgb(107, 114, 128)',
              marginTop: '-0.25rem',
            }}
          >
            (cache)
          </div>
        )}
      </div>
    </ShadowRoot>
  );
};

export function mountBubbleUI(
  node: VoiceMessageNode,
  bubbleController: MessageBubbleController
): void {
  try {
    // Create a temporary container to mount React app
    const tempContainer = document.createElement('div');
    tempContainer.id = `transcrever-audio-temp-${node.messageId}`;
    document.body.appendChild(tempContainer);

    // Render the BubbleUI component
    const root = ReactDOM.createRoot(tempContainer);

    root.render(
      <BubbleUI
        messageId={node.messageId}
        bubbleElement={node.bubbleElement}
        bubbleController={bubbleController}
      />
    );

    // Clean up the temporary container after mounting
    // The actual UI is now in the shadow root
    setTimeout(() => {
      root.unmount();
      tempContainer.remove();
    }, 100);

    logger.log(`UI mounted for message ${node.messageId.slice(0, 16)}...`);
  } catch (error) {
    logger.error(`Failed to mount UI for message ${node.messageId}:`, error);
  }
}
