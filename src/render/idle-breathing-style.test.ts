import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('idle breathing style', () => {
  it('should define a visible idle breathing animation for the pet placeholder', () => {
    const html = readFileSync('index.html', 'utf8');

    expect(html).toContain('@keyframes idle-breathing');
    expect(html).toContain('#pet[data-behavior="idle"]');
    expect(html).toContain('animation: idle-breathing');
  });
});
