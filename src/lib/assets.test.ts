import { describe, expect, it } from 'vitest';
import { MASCOT_URL, assetUrl, joinBase } from './assets';

describe('joinBase', () => {
  it('keeps the root path working for hosts that serve from the domain root', () => {
    expect(joinBase('/', '/audio/vocabulary/x.mp3')).toBe('/audio/vocabulary/x.mp3');
    expect(joinBase('', '/audio/vocabulary/x.mp3')).toBe('/audio/vocabulary/x.mp3');
  });

  it('nests paths under a subpath such as GitHub Pages', () => {
    expect(joinBase('/yalla-quest/', '/audio/vocabulary/x.mp3')).toBe('/yalla-quest/audio/vocabulary/x.mp3');
    expect(joinBase('/yalla-quest', '/characters/faris.svg')).toBe('/yalla-quest/characters/faris.svg');
  });

  it('never produces a double slash or drops the base', () => {
    for (const base of ['/', '/yalla-quest/', '/yalla-quest', 'yalla-quest/']) {
      for (const path of ['/a/b.mp3', 'a/b.mp3', '///a/b.mp3']) {
        const url = joinBase(base, path);
        expect(url).not.toMatch(/([^:])\/\//);
        expect(url.startsWith('/') || /^[a-z-]+\//.test(url)).toBe(true);
        expect(url.endsWith('a/b.mp3')).toBe(true);
      }
    }
  });

  it('leaves absolute and inline sources untouched', () => {
    expect(joinBase('/yalla-quest/', 'https://cdn.example/a.mp3')).toBe('https://cdn.example/a.mp3');
    expect(joinBase('/yalla-quest/', '//cdn.example/a.mp3')).toBe('//cdn.example/a.mp3');
    expect(joinBase('/yalla-quest/', 'data:audio/mp3;base64,AAA')).toBe('data:audio/mp3;base64,AAA');
  });

  it('returns an empty string for missing paths instead of the base', () => {
    expect(joinBase('/yalla-quest/', '')).toBe('');
    expect(assetUrl(undefined)).toBe('');
    expect(assetUrl(null)).toBe('');
  });
});

describe('assetUrl', () => {
  it('resolves the mascot to a usable path in the current build', () => {
    expect(MASCOT_URL).toMatch(/^\/.*\/characters\/faris\.svg$|^\/characters\/faris\.svg$/);
    expect(MASCOT_URL.endsWith('/characters/faris.svg')).toBe(true);
  });
});
