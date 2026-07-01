import { describe, it, expect, vi, afterEach } from 'vitest';
import { OpenRouterService } from './OpenRouterService';
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterApiError,
  OpenRouterNetworkError,
} from './errors';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService();
  });;

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully transcribe audio', async () => {
    const mockResponse = {
      text: 'Hello, this is a test',
      usage: {
        seconds: 2.5,
        total_tokens: 42,
        input_tokens: 30,
        output_tokens: 12,
        cost: 0.00105,
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await service.transcribe(
      { base64Data: 'YWJj', format: 'ogg' },
      {
        apiKey: 'test-key',
        model: 'openai/gpt-4o-mini-transcribe',
      }
    );

    expect(result.text).toBe('Hello, this is a test');
    expect(result.usage.totalTokens).toBe(42);
  });

  it('should throw OpenRouterAuthError on 401', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    await expect(
      service.transcribe(
        { base64Data: 'YWJj', format: 'ogg' },
        { apiKey: 'invalid', model: 'openai/gpt-4o-mini-transcribe' }
      )
    ).rejects.toThrow(OpenRouterAuthError);
  });

  it('should throw OpenRouterRateLimitError on 429', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Map([['retry-after', '60']]),
      json: async () => ({}),
    });

    await expect(
      service.transcribe(
        { base64Data: 'YWJj', format: 'ogg' },
        { apiKey: 'test-key', model: 'openai/gpt-4o-mini-transcribe' }
      )
    ).rejects.toThrow(OpenRouterRateLimitError);
  });

  it('should throw OpenRouterNetworkError on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    await expect(
      service.transcribe(
        { base64Data: 'YWJj', format: 'ogg' },
        { apiKey: 'test-key', model: 'openai/gpt-4o-mini-transcribe' }
      )
    ).rejects.toThrow(OpenRouterNetworkError);
  });
});
