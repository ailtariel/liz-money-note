export const tagColorPalette = [
  '#0F766E',
  '#2563EB',
  '#7C3AED',
  '#C026D3',
  '#DB2777',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#65A30D',
  '#0891B2'
] as const;

export function getTagPaletteColor(index: number) {
  const normalizedIndex =
    ((Math.trunc(index) % tagColorPalette.length) + tagColorPalette.length) %
    tagColorPalette.length;
  return tagColorPalette[normalizedIndex];
}
