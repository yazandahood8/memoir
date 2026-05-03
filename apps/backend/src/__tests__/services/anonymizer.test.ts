import { describe, it, expect } from 'vitest';
import { anonymize, deanonymize } from '../../services/anonymizer.js';

describe('anonymize', () => {
  it('replaces full names with aliases', () => {
    const { anonymized } = anonymize('I met John Smith today.');
    expect(anonymized).toBe('I met Person A today.');
    expect(anonymized).not.toContain('John Smith');
  });

  it('uses consistent aliases for the same name', () => {
    const { anonymized } = anonymize('John Smith said hello. Then John Smith left.');
    expect(anonymized).toBe('Person A said hello. Then Person A left.');
  });

  it('assigns different aliases for different names', () => {
    const { anonymized, nameMap } = anonymize('John Smith and Jane Doe came.');
    expect(nameMap.size).toBe(2);
    expect(anonymized).toContain('Person A');
    expect(anonymized).toContain('Person B');
  });

  it('returns empty nameMap for text without full names', () => {
    const { nameMap } = anonymize('Had ramen at 8am. It was amazing.');
    expect(nameMap.size).toBe(0);
  });

  it('does not anonymize single-word names', () => {
    const { anonymized } = anonymize('Saw Alice at the market.');
    expect(anonymized).toBe('Saw Alice at the market.');
  });
});

describe('deanonymize', () => {
  it('restores original names', () => {
    const { anonymized, nameMap } = anonymize('I met John Smith today.');
    const restored = deanonymize(anonymized, nameMap);
    expect(restored).toContain('John Smith');
  });

  it('handles text with no aliases', () => {
    const nameMap = new Map<string, string>();
    const result = deanonymize('No names here.', nameMap);
    expect(result).toBe('No names here.');
  });

  it('restores multiple names', () => {
    const { anonymized, nameMap } = anonymize('John Smith met Jane Doe.');
    const restored = deanonymize(anonymized, nameMap);
    expect(restored).toContain('John Smith');
    expect(restored).toContain('Jane Doe');
  });
});
