// Common English words that start sentences but aren't name first-parts
const STOP_WORDS = new Set([
  'The', 'Then', 'That', 'This', 'These', 'Those', 'There', 'They', 'Their',
  'When', 'Where', 'What', 'Which', 'While', 'With', 'From', 'Into', 'Over',
  'After', 'Before', 'Because', 'Since', 'Until', 'During', 'Through', 'About',
  'Such', 'Each', 'Both', 'Many', 'Most', 'Some', 'Just', 'Also', 'Very',
  'More', 'Much', 'Even', 'Still', 'Like', 'Back', 'Well', 'Once', 'Now',
  'Saw', 'Had', 'Has', 'Have', 'Was', 'Were', 'Are', 'But', 'And', 'For',
  'Not', 'All', 'Can', 'Did', 'How', 'Its', 'Our', 'Out', 'Two', 'Way',
  'Who', 'Him', 'His', 'Her', 'She', 'One', 'You', 'We', 'So',
]);

export function anonymize(text: string): { anonymized: string; nameMap: Map<string, string> } {
  const nameMap = new Map<string, string>();
  let counter = 0;

  // First pass: collect valid name pairs (not starting with common English words)
  text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, (match) => {
    const [first] = match.split(' ');
    if (!STOP_WORDS.has(first) && !nameMap.has(match)) {
      nameMap.set(match, `Person ${String.fromCharCode(65 + counter++)}`);
    }
    return match;
  });

  // Second pass: replace using literal replaceAll to avoid regex greedy-match issues
  let anonymized = text;
  for (const [name, alias] of nameMap) {
    anonymized = anonymized.replaceAll(name, alias);
  }

  return { anonymized, nameMap };
}

export function deanonymize(text: string, nameMap: Map<string, string>): string {
  let result = text;
  for (const [realName, alias] of nameMap) {
    result = result.replaceAll(alias, realName);
  }
  return result;
}
