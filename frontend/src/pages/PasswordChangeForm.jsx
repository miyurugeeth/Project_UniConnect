import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { api } from '../services/api'
import './PasswordChangeForm.css'

const emptyValues = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

const passwordFields = [
  {
    name: 'currentPassword',
    label: 'Current password',
    autoComplete: 'current-password',
  },
  {
    name: 'newPassword',
    label: 'New password',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmNewPassword',
    label: 'Confirm new password',
    autoComplete: 'new-password',
  },
]

function validate(values) {
  const errors = {}
  const requiredFields = [
    ['currentPassword', 'Enter your current password.'],
    ['newPassword', 'Enter a new password.'],
    ['confirmNewPassword', 'Confirm your new password.'],
  ]

  requiredFields.forEach(([field, message]) => {
    if (!values[field].trim()) {
      errors[field] = message
    }
  })

  if (values.currentPassword && new TextEncoder().encode(values.currentPassword).length > 72) {
    errors.currentPassword = 'Current password must be no more than 72 bytes.'
  }

  if (values.newPassword) {
    if (values.newPassword.length < 12) {
      errors.newPassword = 'Use at least 12 characters for your new password.'
    } else if (new TextEncoder().encode(values.newPassword).length > 72) {
      errors.newPassword = 'New password must be no more than 72 bytes.'
    }
  }

  if (
    values.confirmNewPassword &&
    values.newPassword !== values.confirmNewPassword
  ) {
    errors.confirmNewPassword = 'New passwords do not match.'
  }

  return errors
}

function PasswordChangeForm() {
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [visibleFields, setVisibleFields] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setMessage('')
    setMessageType('')
  }

  function toggleVisibility(field) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSaving) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setMessage('')
    setMessageType('')
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      await api.put('/api/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      })
      setValues({ ...emptyValues })
      setVisibleFields({})
      setMessage('Your password was changed successfully.')
      setMessageType('success')
    } catch (error) {
      const status = error.response?.status
      const backendMessage = error.response?.data?.message

      if (status === 400 && typeof backendMessage === 'string') {
        setMessage(backendMessage)
      } else if (status === 400) {
        setMessage('Check the password fields and try again.')
      } else if (status === 401) {
        setMessage('Your session expired. Please sign in again.')
      } else if (status === 403) {
        setMessage('You are not allowed to change this password.')
      } else if (error.request && !error.response) {
        setMessage(
          'Unable to reach UniConnect. Check that the backend is running and try again.',
        )
      } else if (status >= 500) {
        setMessage('The password service is temporarily unavailable. Please try again.')
      } else {
        setMessage('We could not change your password. Please try again.')
      }
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="password-security-card" aria-labelledby="password-security-heading">
      <div className="password-security-heading">
        <span className="password-security-icon">
          <ShieldCheck size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="dashboard-eyebrow">ACCOUNT SECURITY</p>
          <h2 id="password-security-heading">Change password</h2>
          <p>Update your password to keep your UniConnect account secure.</p>
        </div>
      </div>

      <form className="password-change-form" onSubmit={handleSubmit} noValidate>
        <div className="password-change-grid">
          {passwordFields.map(({ name, label, autoComplete }) => {
            const isVisible = Boolean(visibleFields[name])
            const errorId = `${name}-error`

            return (
              <div className="password-change-field" key={name}>
                <label htmlFor={name}>{label} *</label>
                <div
                  className={`password-change-input-shell${errors[name] ? ' password-change-input-shell--error' : ''}`}
                >
                  <LockKeyhole size={16} aria-hidden="true" />
                  <input
                    id={name}
                    name={name}
                    type={isVisible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    value={values[name]}
                    onChange={updateField}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? errorId : undefined}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    onClick={() => toggleVisibility(name)}
                    aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                    aria-pressed={isVisible}
                  >
                    {isVisible ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors[name] && (
                  <p className="password-change-field-error" id={errorId}>
                    {errors[name]}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="password-change-footer">
          <p className="password-change-hint">
            New passwords must be at least 12 characters and no more than 72 UTF-8 bytes.
          </p>
          <button
            className="dashboard-primary-button password-change-submit"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Updating…' : 'Update password'}
          </button>
        </div>

        {message && (
          <p
            className={`password-change-message password-change-message--${messageType}`}
            role={messageType === 'error' ? 'alert' : 'status'}
          >
            {message}
          </p>
        )}
      </form>
    </section>
  )
}

export default PasswordChangeForm
