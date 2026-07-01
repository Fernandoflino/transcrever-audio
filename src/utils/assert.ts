export function assertNonNull<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (!value) {
    throw new Error(message);
  }
}

export function assertType<T>(
  value: unknown,
  typeName: string
): asserts value is T {
  if (typeof value !== typeName) {
    throw new Error(`Expected type ${typeName}, got ${typeof value}`);
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function hasProperty<T extends PropertyKey>(
  obj: unknown,
  key: T
): obj is Record<T, unknown> {
  return isObject(obj) && key in obj;
}

export function hasProperties<T extends PropertyKey>(
  obj: unknown,
  ...keys: T[]
): obj is Record<T, unknown> {
  if (!isObject(obj)) return false;
  return keys.every((key) => key in obj);
}
