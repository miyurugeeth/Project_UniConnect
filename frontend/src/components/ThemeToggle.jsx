import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun">
        <Sun size={18} aria-hidden="true" />
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon">
        <Moon size={18} aria-hidden="true" />
      </span>
    </button>
  )
}

export default ThemeToggle