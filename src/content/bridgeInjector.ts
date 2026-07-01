import { logger } from '@utils/logger';

export async function injectBridgeScript(): Promise<void> {
  try {
    // Get the path to the injected script from chrome.runtime
    const scriptPath = chrome.runtime.getURL('src/mainWorldBridge/injected.ts');

    // Create a script tag and inject it into the document
    // This runs in the MAIN world context
    const script = document.createElement('script');
    script.src = scriptPath;
    script.onload = () => {
      logger.log('Bridge script loaded');
      script.remove(); // Clean up after loading
    };
    script.onerror = () => {
      logger.error('Failed to load bridge script');
      script.remove();
    };

    // Inject as early as possible
    if (document.documentElement) {
      document.documentElement.appendChild(script);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.appendChild(script);
      });
    }
  } catch (error) {
    logger.error('Error injecting bridge script:', error);
    throw error;
  }
}
