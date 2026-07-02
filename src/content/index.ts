import { logger } from '@utils/logger';
import { WhatsAppAdapter } from '@adapter/WhatsAppAdapter';
import { MessageBubbleController } from './messageBubbleController';
import { injectBridgeScript } from './bridgeInjector';
import { mountBubbleUI } from './uiMounter';
import type { VoiceMessageNode } from '@adapter/types';

logger.log('Content script loaded on', window.location.href);

async function bootstrap() {
  // Inject the MAIN world bridge script first
  try {
    await injectBridgeScript();
    logger.log('Bridge script injected');
  } catch (error) {
    logger.error('Failed to inject bridge script:', error);
    // Continue anyway, Strategy A might work
  }

  // Wait for WhatsApp Web to load
  let attempts = 0;
  const maxAttempts = 150; // ~30 seconds (150 * 200ms)

  while (attempts < maxAttempts) {
    const mainPane = document.querySelector('#main');
    if (mainPane) {
      logger.log('WhatsApp Web loaded, starting observation');
      startObservation();
      return;
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  logger.warn('WhatsApp Web did not load in time after 30 seconds');
}

function startObservation() {
  const adapter = new WhatsAppAdapter();
  const bubbleController = new MessageBubbleController();

  const onNewVoiceMessage = async (node: VoiceMessageNode) => {
    // Skip if already processed
    if (bubbleController.isProcessed(node.bubbleElement)) {
      return;
    }

    bubbleController.markProcessed(node.bubbleElement);

    logger.log(`Detected voice message: ${node.messageId.slice(0, 16)}...`);

    try {
      // Inject UI (button + transcript placeholder)
      mountBubbleUI(node, bubbleController);
    } catch (error) {
      logger.error(`Failed to mount UI for message ${node.messageId}:`, error);
    }
  };

  // Start observing. The adapter anchors on a stable root (#app) and rescans
  // the whole document, so it survives chat switches on its own — no need for
  // a separate navigation observer.
  adapter.observe(onNewVoiceMessage);

  logger.log('Voice message observation started');
}

// Start bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
