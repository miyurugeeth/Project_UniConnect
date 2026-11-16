import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  UsersRound,
} from 'lucide-react'
import './Login.css'

const features = [
  {
    icon: UsersRound,
    title: 'Find your community',
    description: 'Connect with students and alumni from universities across Sri Lanka.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Open new doors',
    description: 'Discover internships, career opportunities and industry insights.',
  },
  {
    icon: GraduationCap,
    title: 'Grow together',
    description: 'Share ideas, collaborate on learning and build your future.',
  },
]

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formMessage, setFormMessage] = useState('')

  function validateForm() {
    const nextErrors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      nextErrors.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Enter your password.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return
    setFormMessage('')

    const nextErrors = validateForm()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsLoading(true)
    try {
      const user = await login(email.trim(), password)
      setPassword('')
      const dashboardPaths = {
        STUDENT: '/student/dashboard',
        PROFESSIONAL: '/professional/dashboard',
        ADMIN: '/admin/dashboard',
      }
      navigate(dashboardPaths[user.role] || '/login', { replace: true })
    } catch (error) {
      const status = error.response?.status

      if (status === 401) {
        setFormMessage('The email address or password is incorrect.')
      } else if (error.request && !error.response) {
        setFormMessage(
          'Unable to reach UniConnect. Check that the backend is running and try again.',
        )
      } else if (status >= 500) {
        setFormMessage('The sign-in service is temporarily unavailable. Please try again.')
      } else {
        setFormMessage('We could not sign you in. Check your details and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value)
    setErrors((current) => ({ ...current, email: '' }))
    setFormMessage('')
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value)
    setErrors((current) => ({ ...current, password: '' }))
    setFormMessage('')
  }

  return (
    <main className="login-page">
      <section className="story-panel" aria-label="About UniConnect">
        <div className="story-panel__glow story-panel__glow--top" />
        <div className="story-panel__glow story-panel__glow--bottom" />

        <a className="brand brand--light" href="/" aria-label="UniConnect home">
          <span className="brand__mark">
            <GraduationCap size={25} strokeWidth={2.1} aria-hidden="true" />
          </span>
          <span className="brand__name">
            Uni<span>Connect</span>
          </span>
        </a>

        <div className="story-content">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            Sri Lanka&apos;s university network
          </p>
          <h1>
            Your university
            <br />
            journey, <span>connected.</span>
          </h1>
          <p className="story-copy">
            A place for ambitious minds to meet. Connect students and industry
            professionals, wherever your path takes you.
          </p>

          <div className="feature-list">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="feature" key={title}>
                <span className="feature__icon">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="story-footer">
          <span className="story-footer__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Made for the next generation of Sri Lankan leaders</span>
        </div>

        <div className="network-art" aria-hidden="true">
          <span className="network-art__ring network-art__ring--outer" />
          <span className="network-art__ring network-art__ring--inner" />
          <span className="network-art__node network-art__node--one" />
          <span className="network-art__node network-art__node--two" />
          <span className="network-art__node network-art__node--three" />
          <span className="network-art__node network-art__node--four" />
          <span className="network-art__center">
            <GraduationCap size={27} strokeWidth={1.6} />
          </span>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="login-heading">
        <div className="form-panel__top">
          <span className="secure-note">
            <LockKeyhole size={14} aria-hidden="true" />
            Your learning network starts here
          </span>
        </div>

        <div className="login-card">
          <div className="mobile-brand">
            <span className="brand__mark">
              <GraduationCap size={23} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span className="brand__name">
              Uni<span>Connect</span>
            </span>
          </div>

          <div className="form-heading">
            <span className="welcome-tag">WELCOME BACK</span>
            <h2 id="login-heading">Good to see you again.</h2>
            <p>Sign in to pick up where your journey left off.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className={`input-shell${errors.email ? ' input-shell--error' : ''}`}>
                <Mail size={18} aria-hidden="true" />
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu.lk"
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p className="field-error" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <a className="text-link" href="#forgot-password">
                  Forgot password?
                </a>
              </div>
              <div className={`input-shell${errors.password ? ' input-shell--error' : ''}`}>
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  className="visibility-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" id="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="remember-option__box" aria-hidden="true">
                <Check size={13} strokeWidth={3} />
              </span>
              <span>Remember me</span>
            </label>

            <button className="submit-button" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Signing in…' : 'Sign in'}</span>
              {!isLoading && <ArrowRight size={18} aria-hidden="true" />}
              {isLoading && <span className="button-spinner" aria-hidden="true" />}
            </button>

            <p className="form-message" aria-live="polite">
              {formMessage}
            </p>
          </form>

          <div className="signup-prompt">
            <span>Don&apos;t have an account?</span>
            <Link className="text-link text-link--strong" to="/register">
              Register <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <p className="terms-note">
            By continuing, you agree to our <a href="#terms">Terms</a> and{' '}
            <a href="#privacy">Privacy Policy</a>.
          </p>
        </div>

        <footer className="form-footer">
          <span>© 2025 UniConnect</span>
          <span className="footer-divider" />
          <span>Connecting potential, creating futures.</span>
        </footer>
      </section>
    </main>
  )
}

export default Login
