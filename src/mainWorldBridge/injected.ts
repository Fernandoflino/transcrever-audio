// This file runs in the MAIN world (injected via chrome.scripting.executeScript)
// It communicates back to the isolated-world content script via window.postMessage
// It locates WhatsApp's internal Store via duck-typing (no hardcoded module IDs)

console.log('[transcrever-audio-bridge] MAIN world injected script loaded');

interface BridgeRequestMessage {
  source: 'transcrever-audio-content';
  type: 'GET_DECRYPTED_AUDIO';
  requestId: string;
  messageId: string;
}

interface BridgeResponseMessage {
  source: 'transcrever-audio-bridge';
  type: 'GET_DECRYPTED_AUDIO_RESULT';
  requestId: string;
  ok: boolean;
  blobUrl?: string;
  errorReason?: string;
}

interface StoreHandles {
  Msg: { get: (id: string) => unknown };
  DownloadManager: { downloadAndDecrypt: (msg: unknown) => Promise<Blob> };
}

let cachedStore: StoreHandles | null = null;

function findStoreModules(): StoreHandles | null {
  if (cachedStore) return cachedStore;

  try {
    // Try to locate window.require or webpack cache
    const wnd = window as Record<string, unknown>;

    // Strategy 1: Look for webpackChunk array (common in webpack bundles)
    const webpackChunks = Object.values(wnd).find(
      (v) => Array.isArray(v) && v[0]?.[0] === 'webpackChunk'
    );

    if (Array.isArray(webpackChunks)) {
      // Try to find require function from webpack chunks
      for (const chunk of webpackChunks) {
        if (Array.isArray(chunk) && typeof chunk[3] === 'function') {
          const require = chunk[3];
          const store = findStoreViaRequire(require);
          if (store) {
            cachedStore = store;
            return store;
          }
        }
      }
    }

    // Strategy 2: Look for a global require function
    if (typeof (wnd.webpackRequire as unknown) === 'function') {
      const require = wnd.webpackRequire as (id: number) => unknown;
      const store = findStoreViaRequire(require);
      if (store) {
        cachedStore = store;
        return store;
      }
    }

    // Strategy 3: Scan window for objects that look like Store
    for (const key of Object.keys(wnd)) {
      const value = wnd[key];
      if (isObject(value) && hasStoreShape(value)) {
        const store = extractStore(value);
        if (store) {
          cachedStore = store;
          return store;
        }
      }
    }

    console.log('[bridge] Could not locate WhatsApp Store');
    return null;
  } catch (error) {
    console.error('[bridge] Error locating Store:', error);
    return null;
  }
}

function findStoreViaRequire(require: (id: number) => unknown): StoreHandles | null {
  try {
    // Try common module patterns
    for (let i = 0; i < 10000; i++) {
      try {
        const module = require(i);
        if (isObject(module) && hasStoreShape(module)) {
          const store = extractStore(module);
          if (store) return store;
        }
      } catch {
        // Module not found, continue
      }
    }
    return null;
  } catch {
    return null;
  }
}

function hasStoreShape(obj: unknown): boolean {
  if (!isObject(obj)) return false;
  // Look for properties that suggest this is the Store object
  const keys = Object.keys(obj);
  return (
    keys.includes('Msg') ||
    keys.includes('DownloadManager') ||
    keys.includes('Chat') ||
    keys.includes('Contact')
  );
}

function extractStore(obj: unknown): StoreHandles | null {
  if (!isObject(obj)) return null;

  const msgModule = obj.Msg;
  const downloadModule = obj.DownloadManager;

  // Validate Msg has a get method
  if (!isObject(msgModule) || typeof msgModule.get !== 'function') {
    return null;
  }

  // Validate DownloadManager has downloadAndDecrypt or similar
  if (!isObject(downloadModule)) {
    return null;
  }

  const downloadFn =
    (downloadModule as Record<string, unknown>).downloadAndDecrypt ||
    (downloadModule as Record<string, unknown>).download ||
    (downloadModule as Record<string, unknown>).decryptAndDownload;

  if (typeof downloadFn !== 'function') {
    return null;
  }

  return {
    Msg: msgModule as StoreHandles['Msg'],
    DownloadManager: {
      downloadAndDecrypt: downloadFn as StoreHandles['DownloadManager']['downloadAndDecrypt'],
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  const message = event.data as BridgeRequestMessage;
  if (message.source !== 'transcrever-audio-content') return;

  if (message.type === 'GET_DECRYPTED_AUDIO') {
    handleGetDecryptedAudio(message);
  }
});

async function handleGetDecryptedAudio(request: BridgeRequestMessage) {
  try {
    const store = findStoreModules();
    if (!store) {
      throw new Error('Could not locate WhatsApp Store modules');
    }

    const messageId = request.messageId;

    // Get the message object from Store
    let msg: unknown;
    try {
      msg = store.Msg.get(messageId);
    } catch (error) {
      throw new Error(`Failed to get message ${messageId}: ${error}`);
    }

    if (!msg) {
      throw new Error(`Message ${messageId} not found in Store`);
    }

    // Download and decrypt the media
    let blob: Blob;
    try {
      blob = await store.DownloadManager.downloadAndDecrypt(msg);
    } catch (error) {
      throw new Error(`Failed to decrypt media: ${error}`);
    }

    // Create a blob URL and send it back
    const blobUrl = URL.createObjectURL(blob);

    const response: BridgeResponseMessage = {
      source: 'transcrever-audio-bridge',
      type: 'GET_DECRYPTED_AUDIO_RESULT',
      requestId: request.requestId,
      ok: true,
      blobUrl,
    };

    window.postMessage(response, '*');
  } catch (error) {
    const response: BridgeResponseMessage = {
      source: 'transcrever-audio-bridge',
      type: 'GET_DECRYPTED_AUDIO_RESULT',
      requestId: request.requestId,
      ok: false,
      errorReason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };

    window.postMessage(response, '*');
  }
}
