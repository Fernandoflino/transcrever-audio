import { logger } from '@utils/logger';
import { MessageRouter } from './messageRouter';
import { handleTranscribe } from './transcribeHandler';
import { SettingsService } from '@services/SettingsService';

logger.log('Background service worker loaded');

const router = new MessageRouter();
const settingsService = new SettingsService();

// Register message handlers
router.registerHandler('TRANSCRIBE_AUDIO', async (message, _sender) => {
  const msg = message as { messageId: string; audioBase64: string; audioFormat: string };
  return handleTranscribe(msg.messageId, msg.audioBase64, msg.audioFormat);
});

router.registerHandler('GET_SETTINGS', async () => {
  return settingsService.getSettings();
});

router.registerHandler('SET_SETTINGS', async (message) => {
  const msg = message as { settings: Record<string, unknown> };
  await settingsService.updateSettings(msg.settings);
  return { ok: true };
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.debug('Received message:', request);

  router
    .route(request, sender)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      logger.error('Error handling message:', error);
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

  return true; // Keep the message channel open for async response
});
