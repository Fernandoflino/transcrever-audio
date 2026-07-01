import { logger } from '@utils/logger';
import { OpenRouterService } from '@api/OpenRouterService';
import { SettingsService } from '@services/SettingsService';
import { TranscriptionService } from '@services/TranscriptionService';
import { TranscriptionCacheService } from '@storage/TranscriptionCacheService';
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterApiError,
  OpenRouterNetworkError,
} from '@api/errors';

export type TranscribeErrorCode =
  | 'MISSING_API_KEY'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface TranscribeResponse {
  type: 'TRANSCRIBE_AUDIO_RESULT';
  ok: true;
  text: string;
  fromCache: boolean;
}

export interface TranscribeErrorResponse {
  type: 'TRANSCRIBE_AUDIO_RESULT';
  ok: false;
  errorCode: TranscribeErrorCode;
  errorMessage: string;
}

export async function handleTranscribe(
  messageId: string,
  audioBase64: string,
  audioFormat: string
): Promise<TranscribeResponse | TranscribeErrorResponse> {
  try {
    const settingsService = new SettingsService();
    const settings = await settingsService.getSettings();

    if (!settings.apiKey) {
      logger.warn('Transcribe request received but API key not configured');
      return {
        type: 'TRANSCRIBE_AUDIO_RESULT',
        ok: false,
        errorCode: 'MISSING_API_KEY',
        errorMessage: 'API key not configured. Please set it in the extension settings.',
      };
    }

    const openRouterService = new OpenRouterService();
    const cacheService = new TranscriptionCacheService();
    const transcriptionService = new TranscriptionService(
      openRouterService,
      cacheService,
      {
        apiKey: settings.apiKey,
        model: settings.model,
        language: settings.language,
      }
    );

    logger.log(`Transcribing message ${messageId.slice(0, 16)}...`);

    const result = await transcriptionService.transcribe(
      audioBase64,
      audioFormat as 'wav' | 'mp3' | 'flac' | 'm4a' | 'ogg' | 'webm' | 'aac'
    );

    logger.log(`Successfully transcribed message ${messageId.slice(0, 16)}...`);

    return {
      type: 'TRANSCRIBE_AUDIO_RESULT',
      ok: true,
      text: result.text,
      fromCache: result.fromCache,
    };
  } catch (error) {
    logger.error('Error during transcription:', error);

    if (error instanceof OpenRouterAuthError) {
      return {
        type: 'TRANSCRIBE_AUDIO_RESULT',
        ok: false,
        errorCode: 'AUTH_ERROR',
        errorMessage: 'Authentication failed. Please check your API key.',
      };
    }

    if (error instanceof OpenRouterRateLimitError) {
      return {
        type: 'TRANSCRIBE_AUDIO_RESULT',
        ok: false,
        errorCode: 'RATE_LIMITED',
        errorMessage: 'Rate limited. Please try again later.',
      };
    }

    if (error instanceof OpenRouterApiError) {
      return {
        type: 'TRANSCRIBE_AUDIO_RESULT',
        ok: false,
        errorCode: 'API_ERROR',
        errorMessage: `API error: ${error.message}`,
      };
    }

    if (error instanceof OpenRouterNetworkError) {
      return {
        type: 'TRANSCRIBE_AUDIO_RESULT',
        ok: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'Network error. Please check your connection.',
      };
    }

    return {
      type: 'TRANSCRIBE_AUDIO_RESULT',
      ok: false,
      errorCode: 'UNKNOWN',
      errorMessage: `Unknown error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}
