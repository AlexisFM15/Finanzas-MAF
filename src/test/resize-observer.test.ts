import { describe, it, expect } from 'vitest';

describe('ResizeObserver Environment Setup', () => {
  it('has ResizeObserver defined globally in test environment', () => {
    expect(globalThis.ResizeObserver).toBeDefined();
    const ro = new ResizeObserver(() => {});
    expect(ro.observe).toBeTypeOf('function');
    expect(ro.disconnect).toBeTypeOf('function');
  });
});
