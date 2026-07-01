export type SupportedAudioFormat = 'wav' | 'mp3' | 'flac' | 'm4a' | 'ogg' | 'webm' | 'aac';

export interface TranscribeOptions {
  apiKey: string;
  model: string;
  language?: string;
  temperature?: number;
}

export interface AudioInput {
  base64Data: string;
  format: SupportedAudioFormat;
}

export interface TranscriptionResult {
  text: string;
  usage: {
    seconds: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface OpenRouterRequestBody {
  model: string;
  input_audio: {
    data: string;
    format: SupportedAudioFormat;
  };
  language?: string;
  temperature?: number;
}

export interface OpenRouterResponseBody {
  text: string;
  usage: {
    seconds: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    cost: number;
  };
}
