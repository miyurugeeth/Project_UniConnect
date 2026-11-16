import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  TrendingUp,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { api } from '../services/api'
import './Login.css'
import './StudentRegistration.css'
import './ProfessionalRegistration.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function splitSkills(value) {
  return [...new Set(value.split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean))]
}

function validate(values) {
  const errors = {}
  const requiredTextFields = [
    ['fullName', 'Full name', 120],
    ['companyName', 'Company name', 200],
    ['industry', 'Industry', 120],
    ['jobPosition', 'Job position', 150],
  ]

  requiredTextFields.forEach(([field, label, maxLength]) => {
    const value = values[field].trim()
    if (!value) {
      errors[field] = `${label} is required.`
    } else if (value.length > maxLength) {
      errors[field] = `${label} must be ${maxLength} characters or fewer.`
    }
  })

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (email.length > 254 || !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Create a password.'
  } else if (values.password.length < 12) {
    errors.password = 'Use at least 12 characters.'
  } else if (new TextEncoder().encode(values.password).length > 72) {
    errors.password = 'Password must be no more than 72 bytes.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  const skills = splitSkills(values.skills)
  if (skills.length > 100) {
    errors.skills = 'Skills can contain at most 100 items.'
  } else if (skills.some((skill) => skill.length > 80)) {
    errors.skills = 'Each skill must be 80 characters or fewer.'
  }

  return errors
}

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  industry: '',
  jobPosition: '',
  skills: '',
}

function ProfessionalRegistration() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formMessage, setFormMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormMessage('')
    if (Object.keys(nextErrors).length > 0) return

    const request = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      companyName: values.companyName.trim(),
      industry: values.industry.trim(),
      jobPosition: values.jobPosition.trim(),
      skills: splitSkills(values.skills),
    }

    setIsLoading(true)
    try {
      await api.post('/api/auth/register/professional', request)
      setValues((current) => ({ ...current, password: '', confirmPassword: '' }))
      setIsRegistered(true)
    } catch (error) {
      const status = error.response?.status
      const backendMessage = error.response?.data?.message

      if ((status === 400 || status === 409) && typeof backendMessage === 'string') {
        setFormMessage(backendMessage)
      } else if (status === 409) {
        setFormMessage('An account with this email already exists. Try signing in instead.')
      } else if (error.request && !error.response) {
        setFormMessage(
          'Unable to reach UniConnect. Check that the backend is running and try again.',
        )
      } else if (status >= 500) {
        setFormMessage('The registration service is temporarily unavailable. Please try again.')
      } else {
        setFormMessage('We could not create your account. Please check your details and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function renderFieldError(field) {
    return errors[field] ? (
      <p className="field-error" id={`${field}-error`}>
        {errors[field]}
      </p>
    ) : null
  }

  return (
    <main className="login-page registration-page professional-registration">
      <section className="story-panel" aria-label="About UniConnect">
        <div className="story-panel__glow story-panel__glow--top" />
        <div className="story-panel__glow story-panel__glow--bottom" />

        <Link className="brand brand--light" to="/" aria-label="UniConnect home">
          <span className="brand__mark">
            <GraduationCap size={25} strokeWidth={2.1} aria-hidden="true" />
          </span>
          <span className="brand__name">
            Uni<span>Connect</span>
          </span>
        </Link>

        <div className="story-content">
          <p className="eyebrow">
            <span className="eyebrow__line" />
            Sri Lanka&apos;s university network
          </p>
          <h1>
            Share what you&apos;ve
            <br />
            learned. <span>Inspire.</span>
          </h1>
          <p className="story-copy">
            Connect your experience with the next generation of students and
            discover new ways to make an impact.
          </p>

          <div className="feature-list">
            <article className="feature">
              <span className="feature__icon">
                <UsersRound size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Meet emerging talent</h2>
                <p>Build meaningful connections with students across Sri Lanka.</p>
              </div>
            </article>
            <article className="feature">
              <span className="feature__icon">
                <BriefcaseBusiness size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Share industry insight</h2>
                <p>Help students explore careers and understand your field.</p>
              </div>
            </article>
            <article className="feature">
              <span className="feature__icon">
                <TrendingUp size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Grow your network</h2>
                <p>Discover ideas, collaborations and fresh perspectives.</p>
              </div>
            </article>
          </div>
        </div>

        <div className="story-footer">
          <span className="story-footer__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Connecting potential, creating futures.</span>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="professional-registration-heading">
        <div className="form-panel__top">
          <span className="secure-note">
            <LockKeyhole size={14} aria-hidden="true" />
            Your information stays protected
          </span>
        </div>

        <div className="login-card registration-card">
          <div className="mobile-brand">
            <span className="brand__mark">
              <GraduationCap size={23} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span className="brand__name">
              Uni<span>Connect</span>
            </span>
          </div>

          {isRegistered ? (
            <div className="registration-success" role="status">
              <span className="registration-success__icon">
                <BriefcaseBusiness size={24} aria-hidden="true" />
              </span>
              <span className="welcome-tag">YOU&apos;RE ALL SET</span>
              <h1 id="professional-registration-heading">Your account is ready.</h1>
              <p>
                Your professional registration was successful. Sign in to continue to
                UniConnect.
              </p>
              <Link className="submit-button registration-login-link" to="/login">
                Go to sign in <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span className="welcome-tag">JOIN UNICONNECT</span>
                <h1 id="professional-registration-heading">
                  Create your professional account.
                </h1>
                <p>Bring your experience to a growing community.</p>
              </div>

              <form className="login-form registration-form" onSubmit={handleSubmit} noValidate>
                <div className="registration-grid">
                  <div className="form-field">
                    <label htmlFor="professional-full-name">Full name *</label>
                    <div className={`input-shell${errors.fullName ? ' input-shell--error' : ''}`}>
                      <UserRound size={17} aria-hidden="true" />
                      <input
                        id="professional-full-name"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        maxLength={120}
                        value={values.fullName}
                        onChange={updateField}
                        placeholder="Your full name"
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                    </div>
                    {renderFieldError('fullName')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="professional-email">Email address *</label>
                    <div className={`input-shell${errors.email ? ' input-shell--error' : ''}`}>
                      <Mail size={17} aria-hidden="true" />
                      <input
                        id="professional-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={values.email}
                        onChange={updateField}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {renderFieldError('email')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="professional-password">Password *</label>
                    <div
                      className={`input-shell${errors.password ? ' input-shell--error' : ''}`}
                    >
                      <LockKeyhole size={17} aria-hidden="true" />
                      <input
                        id="professional-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={values.password}
                        onChange={updateField}
                        placeholder="At least 12 characters"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? 'password-error' : 'password-help'}
                      />
                      <button
                        className="visibility-toggle"
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff size={17} aria-hidden="true" />
                        ) : (
                          <Eye size={17} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <span className="registration-help" id="password-help">
                      Use at least 12 characters.
                    </span>
                    {renderFieldError('password')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="professional-confirm-password">Confirm password *</label>
                    <div
                      className={`input-shell${errors.confirmPassword ? ' input-shell--error' : ''}`}
                    >
                      <LockKeyhole size={17} aria-hidden="true" />
                      <input
                        id="professional-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={values.confirmPassword}
                        onChange={updateField}
                        placeholder="Enter your password again"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={
                          errors.confirmPassword ? 'confirmPassword-error' : undefined
                        }
                      />
                      <button
                        className="visibility-toggle"
                        type="button"
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                        aria-label={
                          showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                        }
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} aria-hidden="true" />
                        ) : (
                          <Eye size={17} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {renderFieldError('confirmPassword')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="professional-company">Company name *</label>
                    <div
                      className={`input-shell${errors.companyName ? ' input-shell--error' : ''}`}
                    >
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                      <input
                        id="professional-company"
                        name="companyName"
                        type="text"
                        autoComplete="organization"
                        maxLength={200}
                        value={values.companyName}
                        onChange={updateField}
                        placeholder="Your company"
                        aria-invalid={Boolean(errors.companyName)}
                        aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                      />
                    </div>
                    {renderFieldError('companyName')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="professional-industry">Industry *</label>
                    <div
                      className={`input-shell${errors.industry ? ' input-shell--error' : ''}`}
                    >
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                      <input
                        id="professional-industry"
                        name="industry"
                        type="text"
                        maxLength={120}
                        value={values.industry}
                        onChange={updateField}
                        placeholder="e.g. Information technology"
                        aria-invalid={Boolean(errors.industry)}
                        aria-describedby={errors.industry ? 'industry-error' : undefined}
                      />
                    </div>
                    {renderFieldError('industry')}
                  </div>

                  <div className="form-field registration-field--full">
                    <label htmlFor="professional-job-position">Job position *</label>
                    <div
                      className={`input-shell${errors.jobPosition ? ' input-shell--error' : ''}`}
                    >
                      <UserRound size={17} aria-hidden="true" />
                      <input
                        id="professional-job-position"
                        name="jobPosition"
                        type="text"
                        maxLength={150}
                        value={values.jobPosition}
                        onChange={updateField}
                        placeholder="Your current position"
                        aria-invalid={Boolean(errors.jobPosition)}
                        aria-describedby={errors.jobPosition ? 'jobPosition-error' : undefined}
                      />
                    </div>
                    {renderFieldError('jobPosition')}
                  </div>

                  <div className="form-field registration-field--full">
                    <label htmlFor="professional-skills">Skills</label>
                    <textarea
                      className="registration-textarea"
                      id="professional-skills"
                      name="skills"
                      rows="3"
                      value={values.skills}
                      onChange={updateField}
                      placeholder="For example: Leadership, Data analysis, Mentoring"
                      aria-invalid={Boolean(errors.skills)}
                      aria-describedby={errors.skills ? 'skills-help skills-error' : 'skills-help'}
                    />
                    <span className="registration-help" id="skills-help">
                      Separate skills with commas or new lines.
                    </span>
                    {renderFieldError('skills')}
                  </div>
                </div>

                {formMessage && (
                  <p className="registration-message" role="alert">
                    {formMessage}
                  </p>
                )}

                <button className="submit-button registration-submit" type="submit" disabled={isLoading}>
                  <span>{isLoading ? 'Creating account…' : 'Create professional account'}</span>
                  {!isLoading && <ArrowRight size={18} aria-hidden="true" />}
                  {isLoading && <span className="button-spinner" aria-hidden="true" />}
                </button>
              </form>

              <div className="signup-prompt">
                <span>Already have an account?</span>
                <Link className="text-link text-link--strong" to="/login">
                  Sign in
                </Link>
              </div>
            </>
          )}
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

export default ProfessionalRegistration
