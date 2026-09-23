import type { ThemePreference } from '../lib/useTheme'

const modes = [
  { value: 'light', label: '白天模式', path: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5' },
  { value: 'dark', label: '黑夜模式', path: 'M20 14A8 8 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z' },
  { value: 'system', label: '跟随系统', path: 'M4 4h16v12H4ZM8 20h8m-4-4v4' },
] as const

export default function ThemeToggle({ preference, onChange }: { preference: ThemePreference; onChange: (value: ThemePreference) => void }) {
  return (
    <div className="theme-toggle" role="group" aria-label="外观模式">
      {modes.map(({ value, label, path }) => (
        <button key={value} type="button" title={label} aria-label={label} aria-pressed={preference === value} onClick={() => onChange(value)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
        </button>
      ))}
    </div>
  )
}
