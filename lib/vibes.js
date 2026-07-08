export const VIBES = [
  {
    id: 'clean', name: 'Clean', desc: 'Bright & minimal', preview: ['#ffffff', '#f5f5f5', '#111111'],
    fonts: [
      { id: 'inter',        name: 'Inter',            serif: false, weights: '400;600;700' },
      { id: 'plus-jakarta', name: 'Plus Jakarta Sans', serif: false, weights: '400;600;700' },
      { id: 'dm-sans',      name: 'DM Sans',          serif: false, weights: '400;600;700' },
      { id: 'outfit',       name: 'Outfit',           serif: false, weights: '400;600;700' },
    ],
  },
  {
    id: 'luxe', name: 'Luxe', desc: 'Serif editorial', preview: ['#faf9f7', '#ece8e2', '#8a6a3a'],
    fonts: [
      { id: 'playfair',  name: 'Playfair Display',   serif: true, weights: '400;600;700' },
      { id: 'cormorant', name: 'Cormorant Garamond',  serif: true, weights: '400;600;700' },
      { id: 'dm-serif',  name: 'DM Serif Display',   serif: true, weights: '400' },
      { id: 'libre-bas', name: 'Libre Baskerville',  serif: true, weights: '400;700' },
    ],
  },
  {
    id: 'bold', name: 'Bold', desc: 'Expanded type, vivid', preview: ['#eeeeee', '#111111', '#e63946'],
    fonts: [
      { id: 'bebas',   name: 'Bebas Neue',       serif: false, weights: '400' },
      { id: 'oswald',  name: 'Oswald',           serif: false, weights: '400;600;700' },
      { id: 'barlow',  name: 'Barlow Condensed', serif: false, weights: '400;600;700' },
      { id: 'space-g', name: 'Space Grotesk',    serif: false, weights: '400;600;700' },
    ],
  },
  {
    id: 'soft', name: 'Soft', desc: 'Rounded & peachy warm', preview: ['#fdf5ef', '#f0e0d0', '#d4845a'],
    fonts: [
      { id: 'nunito',    name: 'Nunito',    serif: false, weights: '400;600;700;800' },
      { id: 'quicksand', name: 'Quicksand', serif: false, weights: '400;600;700' },
      { id: 'comfortaa', name: 'Comfortaa', serif: false, weights: '400;600;700' },
      { id: 'jost',      name: 'Jost',      serif: false, weights: '400;600;700' },
    ],
  },
  {
    id: 'dark', name: 'Dark', desc: 'Dark mode, lime accent', preview: ['#0f0f0f', '#1c1c1c', '#e6fd53'],
    fonts: [
      { id: 'space-g', name: 'Space Grotesk', serif: false, weights: '400;600;700' },
      { id: 'syne',    name: 'Syne',          serif: false, weights: '400;600;700;800' },
      { id: 'josefin', name: 'Josefin Sans',  serif: false, weights: '400;600;700' },
      { id: 'outfit',  name: 'Outfit',        serif: false, weights: '400;600;700' },
    ],
  },
]

export const FONT_LOOKUP = {}
for (const v of VIBES) {
  for (const f of v.fonts) {
    if (!FONT_LOOKUP[f.id]) FONT_LOOKUP[f.id] = f
  }
}

export function fontCss(font) {
  if (!font) return null
  return `'${font.name}', ${font.serif ? 'serif' : 'sans-serif'}`
}

export function fontGoogleUrl(font) {
  if (!font) return null
  const family = font.name.replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${font.weights}&display=swap`
}

export const VIBE_THEMES = {
  clean: {
    bg: '#f5f5f5',
    header: { bg: 'white', border: '#eeeeee', text: '#111', iconBg: '#f0f0f0', nameFont: "'Zalando Sans'", nameWeight: 800, nameFontSize: 15 },
    search: { bg: '#f5f5f5', border: '#e8e8e8', text: '#111', placeholder: '#999', iconColor: '#999' },
    tab: { bg: '#e8e8e8', text: '#555', activeBg: '#111', activeText: '#fff' },
    card: { imgBg: '#e8e8e8', radius: 16, nameFont: "'Zalando Sans'", nameWeight: 600, nameColor: '#111', priceColor: '#111', catColor: '#999', priceFontFamily: "'Zalando Sans SemiCondensed'" },
    section: { font: "'Zalando Sans'", weight: 700, color: '#111', subColor: '#999' },
    bottom: { bg: 'white', border: '#eee', inputBg: '#f5f5f5', inputBorder: '#e8e8e8', iconColor: '#aaa', textColor: '#111' },
    announcement: { bg: '#111', text: '#e6fd53' },
  },
  luxe: {
    bg: '#faf9f7',
    header: { bg: '#faf9f7', border: '#e8e4de', text: '#1a1209', iconBg: '#f0ece4', nameFont: 'Georgia, serif', nameWeight: 700, nameFontSize: 15 },
    search: { bg: 'white', border: '#e8e4de', text: '#1a1209', placeholder: '#a09080', iconColor: '#a09080' },
    tab: { bg: '#f0ece4', text: '#7a6a58', activeBg: '#1a1209', activeText: '#faf9f7' },
    card: { imgBg: '#ece8e2', radius: 4, nameFont: 'Georgia, serif', nameWeight: 600, nameColor: '#1a1209', priceColor: '#8a6a3a', catColor: '#8a7f72', priceFontFamily: 'Georgia, serif' },
    section: { font: 'Georgia, serif', weight: 700, color: '#1a1209', subColor: '#8a7f72' },
    bottom: { bg: '#faf9f7', border: '#e8e4de', inputBg: '#f5f0ea', inputBorder: '#e0d8ce', iconColor: '#8a7f72', textColor: '#1a1209' },
    announcement: { bg: '#1a1209', text: '#f0e8d4' },
  },
  bold: {
    bg: '#eeeeee',
    header: { bg: '#111111', border: '#222222', text: '#ffffff', iconBg: '#222', nameFont: "'Zalando Sans Expanded'", nameWeight: 800, nameFontSize: 13 },
    search: { bg: '#1c1c1c', border: '#333', text: '#fff', placeholder: '#666', iconColor: '#666' },
    tab: { bg: '#ddd', text: '#555', activeBg: '#e63946', activeText: '#fff' },
    card: { imgBg: '#d8d8d8', radius: 0, nameFont: "'Zalando Sans Expanded'", nameWeight: 800, nameColor: '#111', priceColor: '#e63946', catColor: '#777', priceFontFamily: "'Zalando Sans Expanded'" },
    section: { font: "'Zalando Sans Expanded'", weight: 800, color: '#111', subColor: '#777' },
    bottom: { bg: '#111', border: '#222', inputBg: '#222', inputBorder: '#333', iconColor: '#666', textColor: '#fff' },
    announcement: { bg: '#e63946', text: '#fff' },
  },
  soft: {
    bg: '#fdf5ef',
    header: { bg: '#fdf5ef', border: '#f2e4d8', text: '#3d2010', iconBg: '#f5e8dc', nameFont: 'Georgia, serif', nameWeight: 700, nameFontSize: 15 },
    search: { bg: 'white', border: '#f2e4d8', text: '#3d2010', placeholder: '#b08070', iconColor: '#b08070' },
    tab: { bg: '#f5e8dc', text: '#9a7060', activeBg: '#d4845a', activeText: '#fff' },
    card: { imgBg: '#f0e0d0', radius: 24, nameFont: "'Zalando Sans'", nameWeight: 600, nameColor: '#3d2010', priceColor: '#d4845a', catColor: '#9a7060', priceFontFamily: "'Zalando Sans'" },
    section: { font: 'Georgia, serif', weight: 700, color: '#3d2010', subColor: '#9a7060' },
    bottom: { bg: '#fdf5ef', border: '#f2e4d8', inputBg: '#f5e8dc', inputBorder: '#ecd8c8', iconColor: '#c09078', textColor: '#3d2010' },
    announcement: { bg: '#3d2010', text: '#fdf5ef' },
  },
  dark: {
    bg: '#0f0f0f',
    header: { bg: '#0f0f0f', border: '#1c1c1c', text: '#ffffff', iconBg: '#1c1c1c', nameFont: "'Zalando Sans Expanded'", nameWeight: 800, nameFontSize: 13 },
    search: { bg: '#1c1c1c', border: '#2a2a2a', text: '#fff', placeholder: 'rgba(255,255,255,0.4)', iconColor: 'rgba(255,255,255,0.4)' },
    tab: { bg: '#1c1c1c', text: 'rgba(255,255,255,0.5)', activeBg: '#e6fd53', activeText: '#0f0f0f' },
    card: { imgBg: '#1c1c1c', radius: 12, nameFont: "'Zalando Sans'", nameWeight: 600, nameColor: '#fff', priceColor: '#e6fd53', catColor: 'rgba(255,255,255,0.4)', priceFontFamily: "'Zalando Sans SemiCondensed'" },
    section: { font: "'Zalando Sans'", weight: 700, color: '#fff', subColor: 'rgba(255,255,255,0.4)' },
    bottom: { bg: '#0f0f0f', border: '#1c1c1c', inputBg: '#1c1c1c', inputBorder: '#2a2a2a', iconColor: 'rgba(255,255,255,0.35)', textColor: '#fff' },
    announcement: { bg: '#e6fd53', text: '#0f0f0f' },
  },
}

export function getTheme(vibeId) {
  return VIBE_THEMES[vibeId] || VIBE_THEMES.clean
}
