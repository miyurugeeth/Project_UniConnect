import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { api } from '../services/api'
import './Login.css'
import './StudentRegistration.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function splitList(value) {
  return [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))]
}

function validate(values) {
  const errors = {}
  const requiredTextFields = [
    ['fullName', 'Full name', 120],
    ['universityName', 'University name', 200],
    ['faculty', 'Faculty', 150],
    ['departmentOrField', 'Department or field', 150],
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

  const batchYear = Number(values.batchYear)
  if (!values.batchYear || !Number.isInteger(batchYear) || batchYear < 1900 || batchYear > 2200) {
    errors.batchYear = 'Enter a whole year between 1900 and 2200.'
  }

  const academicYear = Number(values.currentAcademicYear)
  if (
    !values.currentAcademicYear ||
    !Number.isInteger(academicYear) ||
    academicYear < 1 ||
    academicYear > 20
  ) {
    errors.currentAcademicYear = 'Enter a whole year between 1 and 20.'
  }

  if (values.profileImageUrl.trim().length > 2048) {
    errors.profileImageUrl = 'The image URL must be 2048 characters or fewer.'
  }

  const listFields = [
    ['skills', 'Skills'],
    ['interests', 'Interests'],
  ]
  listFields.forEach(([field, label]) => {
    const items = splitList(values[field])
    if (items.length > 100) {
      errors[field] = `${label} can contain at most 100 items.`
    } else if (items.some((item) => item.length > 80)) {
      errors[field] = `Each ${label.toLowerCase()} item must be 80 characters or fewer.`
    }
  })

  return errors
}

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  universityName: '',
  faculty: '',
  departmentOrField: '',
  batchYear: '',
  currentAcademicYear: '',
  skills: '',
  interests: '',
  profileImageUrl: '',
}

function StudentRegistration() {
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
      universityName: values.universityName.trim(),
      faculty: values.faculty.trim(),
      departmentOrField: values.departmentOrField.trim(),
      batchYear: Number(values.batchYear),
      currentAcademicYear: Number(values.currentAcademicYear),
      skills: splitList(values.skills),
      interests: splitList(values.interests),
      profileImageUrl: values.profileImageUrl.trim() || null,
    }

    setIsLoading(true)
    try {
      await api.post('/api/auth/register/student', request)
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
    <main className="login-page registration-page">
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
            Make your next
            <br />
            connection <span>count.</span>
          </h1>
          <p className="story-copy">
            Create your student profile and find a community that helps you learn,
            collaborate and grow.
          </p>

          <div className="feature-list">
            <article className="feature">
              <span className="feature__icon">
                <UsersRound size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Meet your community</h2>
                <p>Connect with students and professionals across Sri Lanka.</p>
              </div>
            </article>
            <article className="feature">
              <span className="feature__icon">
                <BriefcaseBusiness size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Find new opportunities</h2>
                <p>Discover internships, career paths and industry insights.</p>
              </div>
            </article>
            <article className="feature">
              <span className="feature__icon">
                <BookOpen size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Learn and grow together</h2>
                <p>Share what you know and build your future with others.</p>
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
          <span>Made for the next generation of Sri Lankan leaders</span>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="registration-heading">
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
                <GraduationCap size={24} aria-hidden="true" />
              </span>
              <span className="welcome-tag">YOU&apos;RE ALL SET</span>
              <h1 id="registration-heading">Your account is ready.</h1>
              <p>
                Your student registration was successful. Sign in to continue to
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
                <h1 id="registration-heading">Create your student account.</h1>
                <p>Start building your university network today.</p>
              </div>

              <form className="login-form registration-form" onSubmit={handleSubmit} noValidate>
                <div className="registration-grid">
                  <div className="form-field">
                    <label htmlFor="register-full-name">Full name *</label>
                    <div className={`input-shell${errors.fullName ? ' input-shell--error' : ''}`}>
                      <UserRound size={17} aria-hidden="true" />
                      <input
                        id="register-full-name"
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
                    <label htmlFor="register-email">Email address *</label>
                    <div className={`input-shell${errors.email ? ' input-shell--error' : ''}`}>
                      <Mail size={17} aria-hidden="true" />
                      <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={values.email}
                        onChange={updateField}
                        placeholder="you@university.edu.lk"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {renderFieldError('email')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-password">Password *</label>
                    <div
                      className={`input-shell${errors.password ? ' input-shell--error' : ''}`}
                    >
                      <LockKeyhole size={17} aria-hidden="true" />
                      <input
                        id="register-password"
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
                    <label htmlFor="register-confirm-password">Confirm password *</label>
                    <div
                      className={`input-shell${errors.confirmPassword ? ' input-shell--error' : ''}`}
                    >
                      <LockKeyhole size={17} aria-hidden="true" />
                      <input
                        id="register-confirm-password"
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
                    <label htmlFor="register-university">University name *</label>
                    <div
                      className={`input-shell${errors.universityName ? ' input-shell--error' : ''}`}
                    >
                      <GraduationCap size={17} aria-hidden="true" />
                      <input
                        id="register-university"
                        name="universityName"
                        type="text"
                        autoComplete="organization"
                        maxLength={200}
                        value={values.universityName}
                        onChange={updateField}
                        placeholder="Your university"
                        aria-invalid={Boolean(errors.universityName)}
                        aria-describedby={
                          errors.universityName ? 'universityName-error' : undefined
                        }
                      />
                    </div>
                    {renderFieldError('universityName')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-faculty">Faculty *</label>
                    <div className={`input-shell${errors.faculty ? ' input-shell--error' : ''}`}>
                      <BookOpen size={17} aria-hidden="true" />
                      <input
                        id="register-faculty"
                        name="faculty"
                        type="text"
                        maxLength={150}
                        value={values.faculty}
                        onChange={updateField}
                        placeholder="Your faculty"
                        aria-invalid={Boolean(errors.faculty)}
                        aria-describedby={errors.faculty ? 'faculty-error' : undefined}
                      />
                    </div>
                    {renderFieldError('faculty')}
                  </div>

                  <div className="form-field registration-field--full">
                    <label htmlFor="register-department">Department or field of study *</label>
                    <div
                      className={`input-shell${errors.departmentOrField ? ' input-shell--error' : ''}`}
                    >
                      <BookOpen size={17} aria-hidden="true" />
                      <input
                        id="register-department"
                        name="departmentOrField"
                        type="text"
                        maxLength={150}
                        value={values.departmentOrField}
                        onChange={updateField}
                        placeholder="Your department or field"
                        aria-invalid={Boolean(errors.departmentOrField)}
                        aria-describedby={
                          errors.departmentOrField ? 'departmentOrField-error' : undefined
                        }
                      />
                    </div>
                    {renderFieldError('departmentOrField')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-batch-year">Batch year *</label>
                    <div
                      className={`input-shell${errors.batchYear ? ' input-shell--error' : ''}`}
                    >
                      <input
                        id="register-batch-year"
                        name="batchYear"
                        type="number"
                        min="1900"
                        max="2200"
                        step="1"
                        value={values.batchYear}
                        onChange={updateField}
                        placeholder="e.g. 2025"
                        aria-invalid={Boolean(errors.batchYear)}
                        aria-describedby={errors.batchYear ? 'batchYear-error' : undefined}
                      />
                    </div>
                    {renderFieldError('batchYear')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-academic-year">Current academic year *</label>
                    <div
                      className={`input-shell${errors.currentAcademicYear ? ' input-shell--error' : ''}`}
                    >
                      <input
                        id="register-academic-year"
                        name="currentAcademicYear"
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        value={values.currentAcademicYear}
                        onChange={updateField}
                        placeholder="e.g. 2"
                        aria-invalid={Boolean(errors.currentAcademicYear)}
                        aria-describedby={
                          errors.currentAcademicYear ? 'currentAcademicYear-error' : undefined
                        }
                      />
                    </div>
                    {renderFieldError('currentAcademicYear')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-skills">Skills</label>
                    <textarea
                      className="registration-textarea"
                      id="register-skills"
                      name="skills"
                      rows="3"
                      value={values.skills}
                      onChange={updateField}
                      placeholder="For example: Java, Research, Public speaking"
                      aria-invalid={Boolean(errors.skills)}
                      aria-describedby={errors.skills ? 'skills-help skills-error' : 'skills-help'}
                    />
                    <span className="registration-help" id="skills-help">
                      Separate skills with commas or new lines.
                    </span>
                    {renderFieldError('skills')}
                  </div>

                  <div className="form-field">
                    <label htmlFor="register-interests">Interests</label>
                    <textarea
                      className="registration-textarea"
                      id="register-interests"
                      name="interests"
                      rows="3"
                      value={values.interests}
                      onChange={updateField}
                      placeholder="For example: Design, Entrepreneurship"
                      aria-invalid={Boolean(errors.interests)}
                      aria-describedby={
                        errors.interests
                          ? 'interests-help interests-error'
                          : 'interests-help'
                      }
                    />
                    <span className="registration-help" id="interests-help">
                      Separate interests with commas or new lines.
                    </span>
                    {renderFieldError('interests')}
                  </div>

                  <div className="form-field registration-field--full">
                    <label htmlFor="register-profile-image">Profile image URL (optional)</label>
                    <input
                      className={`registration-plain-input${errors.profileImageUrl ? ' registration-plain-input--error' : ''}`}
                      id="register-profile-image"
                      name="profileImageUrl"
                      type="url"
                      maxLength={2048}
                      value={values.profileImageUrl}
                      onChange={updateField}
                      placeholder="https://example.com/your-photo.jpg"
                      aria-invalid={Boolean(errors.profileImageUrl)}
                      aria-describedby={
                        errors.profileImageUrl ? 'profileImageUrl-error' : undefined
                      }
                    />
                    {renderFieldError('profileImageUrl')}
                  </div>
                </div>

                {formMessage && (
                  <p className="registration-message" role="alert">
                    {formMessage}
                  </p>
                )}

                <button className="submit-button registration-submit" type="submit" disabled={isLoading}>
                  <span>{isLoading ? 'Creating account…' : 'Create student account'}</span>
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

          <div className="signup-prompt professional-register-prompt">
            <span>Are you an industry professional?</span>
            <Link className="text-link text-link--strong" to="/register/professional">
              Register here.
            </Link>
          </div>
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

export default StudentRegistration
