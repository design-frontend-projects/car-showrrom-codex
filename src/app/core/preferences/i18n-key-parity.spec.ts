import { readFileSync } from 'node:fs';
import { join } from 'node:path';

declare const process: { cwd(): string };

describe('i18n translation files', () => {
  it('keeps Arabic keys in parity with English keys', () => {
    const en = readTranslationFile('en');
    const ar = readTranslationFile('ar');

    expect(flattenKeys(ar)).toEqual(flattenKeys(en));
  });
});

function readTranslationFile(language: string): unknown {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', 'i18n', `${language}.json`), 'utf-8'));
}

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenKeys(item, `${prefix}[${index}]`));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key))
      .sort();
  }

  return [prefix];
}
