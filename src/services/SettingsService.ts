import { DEFAULT_SETTINGS, type ExtensionSettings } from '@storage/types';

export class SettingsService {
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.sync.get(
      Object.keys(DEFAULT_SETTINGS)
    );

    return {
      apiKey: result.apiKey ?? DEFAULT_SETTINGS.apiKey,
      model: result.model ?? DEFAULT_SETTINGS.model,
      language: result.language ?? DEFAULT_SETTINGS.language,
    };
  }

  async setSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  }

  async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    await chrome.storage.sync.set(settings);
  }

  onSettingsChanged(
    callback: (newSettings: ExtensionSettings) => void
  ): () => void {
    const listener = () => {
      this.getSettings().then(callback);
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }
}
