export interface Swatch {
  name: string
  value: string
}

export const ACCENTS: Swatch[] = [
  { name: 'Amber', value: '#f5a524' },
  { name: 'Ember', value: '#f0616d' },
  { name: 'Lime', value: '#9ece6a' },
  { name: 'Emerald', value: '#41c777' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Sky', value: '#4aa8ff' },
  { name: 'Indigo', value: '#7c8aff' },
  { name: 'Violet', value: '#b48cff' },
  { name: 'Magenta', value: '#e26ee5' },
  { name: 'Sand', value: '#d6b370' },
]

export const NOTE_COLORS: Swatch[] = [{ name: 'None', value: '' }, ...ACCENTS]

export const TEXT_COLORS: Swatch[] = [
  { name: 'Red', value: '#f0616d' },
  { name: 'Orange', value: '#f5a524' },
  { name: 'Yellow', value: '#e5c07b' },
  { name: 'Green', value: '#41c777' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Blue', value: '#4aa8ff' },
  { name: 'Violet', value: '#b48cff' },
  { name: 'Pink', value: '#e26ee5' },
  { name: 'Muted', value: '#8a9090' },
]

export function accentSoft(value: string, alpha = 0.16): string {
  const hex = value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
