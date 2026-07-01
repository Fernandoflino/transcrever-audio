import type { AudioInput, TranscribeOptions, TranscriptionResult, OpenRouterRequestBody, OpenRouterResponseBody } from './types';
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterApiError,
  OpenRouterNetworkError,
} from './errors';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/audio/transcriptions';

export class OpenRouterService {
  async transcribe(
    audio: AudioInput,
    options: TranscribeOptions
  ): Promise<TranscriptionResult> {
    const requestBody: OpenRouterRequestBody = {
      model: options.model,
      input_audio: {
        data: audio.base64Data,
        format: audio.format,
      },
      ...(options.language && { language: options.language }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = (await response.json()) as OpenRouterResponseBody;
      return this.mapResponse(data);
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterNetworkError(
        error instanceof Error ? error.message : 'Unknown network error'
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;

    if (status === 401 || status === 403) {
      throw new OpenRouterAuthError(`Authentication failed: ${response.statusText}`);
    }

    if (status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
      throw new OpenRouterRateLimitError(retryAfterMs);
    }

    let errorMessage = `API error: ${response.statusText}`;
    try {
      const errorData = await response.json() as Record<string, unknown>;
      errorMessage = (errorData.error as Record<string, unknown>)?.message as string || errorMessage;
    } catch {
      // If response is not JSON, use status text
    }

    throw new OpenRouterApiError(status, errorMessage);
  }

  private mapResponse(data: OpenRouterResponseBody): TranscriptionResult {
    return {
      text: data.text,
      usage: {
        seconds: data.usage.seconds,
        totalTokens: data.usage.total_tokens,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        cost: data.usage.cost,
      },
    };
  }
}
