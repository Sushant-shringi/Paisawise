import { describe, it, expect } from 'vitest';
import { PAISAWISE_THEMES, ThemeId } from '../ThemeContext';

describe('PaisaWise Theme System (5 Themes)', () => {
  it('contains exactly the 5 themes shown in the reference design', () => {
    const expectedIds: ThemeId[] = [
      'professional-carbon',
      'crimson-dusk',
      'cobalt-steel',
      'ember-glow',
      'mint-frost'
    ];

    expect(PAISAWISE_THEMES.length).toBe(5);
    const themeIds = PAISAWISE_THEMES.map(t => t.id);
    expect(themeIds).toEqual(expectedIds);
  });

  it('correctly categorizes dark vs light modes', () => {
    const carbon = PAISAWISE_THEMES.find(t => t.id === 'professional-carbon')!;
    const crimson = PAISAWISE_THEMES.find(t => t.id === 'crimson-dusk')!;
    const cobalt = PAISAWISE_THEMES.find(t => t.id === 'cobalt-steel')!;
    const ember = PAISAWISE_THEMES.find(t => t.id === 'ember-glow')!;
    const mint = PAISAWISE_THEMES.find(t => t.id === 'mint-frost')!;

    expect(carbon.isDark).toBe(true);
    expect(crimson.isDark).toBe(true);
    expect(cobalt.isDark).toBe(true);
    expect(ember.isDark).toBe(true);
    expect(mint.isDark).toBe(false);

    expect(mint.mode).toBe('light');
    expect(carbon.mode).toBe('dark');
  });

  it('provides color swatches and accent colors for every theme', () => {
    for (const t of PAISAWISE_THEMES) {
      expect(t.accentColor).toBeDefined();
      expect(t.accentColor.startsWith('#')).toBe(true);
      expect(t.swatches.length).toBeGreaterThanOrEqual(4);
      expect(t.name.length).toBeGreaterThan(0);
    }
  });

  it('has distinct accent colors for each theme', () => {
    const crimson = PAISAWISE_THEMES.find(t => t.id === 'crimson-dusk')!;
    const cobalt = PAISAWISE_THEMES.find(t => t.id === 'cobalt-steel')!;
    const ember = PAISAWISE_THEMES.find(t => t.id === 'ember-glow')!;
    const carbon = PAISAWISE_THEMES.find(t => t.id === 'professional-carbon')!;
    const mint = PAISAWISE_THEMES.find(t => t.id === 'mint-frost')!;

    expect(crimson.accentColor).toBe('#e11d48'); // Rose/Crimson
    expect(cobalt.accentColor).toBe('#06b6d4');  // Cyan
    expect(ember.accentColor).toBe('#f97316');   // Ember Orange
    expect(carbon.accentColor).toBe('#10b981');  // Emerald
    expect(mint.accentColor).toBe('#059669');    // Mint
  });
});
