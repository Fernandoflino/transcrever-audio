export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'OpenRouterAuthError';
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    public retryAfterMs?: number,
    message = 'Rate limited by OpenRouter'
  ) {
    super(message);
    this.name = 'OpenRouterRateLimitError';
  }
}

export class OpenRouterApiError extends OpenRouterError {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'OpenRouterApiError';
  }
}

export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'OpenRouterNetworkError';
  }
}
