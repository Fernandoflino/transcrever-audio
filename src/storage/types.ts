export const DB_NAME = 'transcrever-audio-cache';
export const DB_VERSION = 1;
export const STORE_NAME = 'transcripts';

export interface CachedTranscriptRecord {
  hash: string; // SHA-256 hex, primary key
  text: string;
  model: string;
  language?: string;
  createdAt: number; // epoch ms
}

export interface ExtensionSettings {
  apiKey: string;
  model: string;
  language?: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: '',
  model: 'openai/gpt-4o-mini-transcribe',
  language: undefined,
};
