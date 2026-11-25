import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import './AdminDashboard.css'

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  bootstrapKey: '',
  password: '',
  confirmPassword: '',
}

function AdminSetup() {
  const [form, setForm] = useState(emptyForm)
  const [available, setAvailable] = useState(null)
  const [bootstrapConfigured, setBootstrapConfigured] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/api/admin/bootstrap/status')
      .then(({ data }) => {
        if (active) {
          setAvailable(Boolean(data.available))
          setBootstrapConfigured(Boolean(data.configured))
        }
      })
      .catch(() => {
        if (active) setStatusError('We could not check administrator setup. Refresh and try again.')
      })
    return () => {
      active = false
    }
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    try {
      const { bootstrapKey, ...adminAccount } = form
      await api.post('/api/admin/bootstrap', adminAccount, {
        headers: { 'X-Admin-Bootstrap-Key': bootstrapKey },
      })
      setCreated(true)
      setAvailable(false)
      setMessage('Your administrator account is ready. Sign in to continue.')
    } catch (error) {
      setMessage(
        error.response?.status === 409
          ? 'Initial administrator setup has already been completed.'
          : error.response?.data?.message || 'We could not create the administrator account.',
      )
      if (error.response?.status === 409) setAvailable(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="admin-setup-page">
      <section className="admin-panel admin-setup-card">
        <p className="admin-eyebrow">UNICONNECT ADMIN</p>
        <h1>Set up the first administrator</h1>
        {available === null ? (
          <p className={statusError ? 'admin-error' : 'admin-muted'} role={statusError ? 'alert' : undefined}>
            {statusError || 'Checking administrator setup…'}
          </p>
        ) : created ? (
          <p className="admin-notice" role="status">{message}</p>
        ) : !available ? (
          <>
            <p className="admin-muted">
              Initial setup is closed because an administrator account already exists.
            </p>
            <Link className="admin-primary-link" to="/login">Go to sign in</Link>
          </>
        ) : !bootstrapConfigured ? (
          <p className="admin-error" role="alert">
            Initial setup is not enabled. The server owner must configure ADMIN_BOOTSTRAP_KEY first.
          </p>
        ) : (
          <>
            <p className="admin-muted">
              This one-time form is available only until the first administrator is created.
            </p>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input name="fullName" autoComplete="name" maxLength={120} required value={form.fullName} onChange={updateField} />
              </label>
              <label>
                Username
                <input name="username" autoComplete="username" minLength={3} maxLength={80} pattern="[A-Za-z0-9._-]+" required value={form.username} onChange={updateField} />
              </label>
              <label>
                Email address
                <input name="email" type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={updateField} />
              </label>
              <label>
                Initial setup key
                <input name="bootstrapKey" type="password" autoComplete="off" required value={form.bootstrapKey} onChange={updateField} />
              </label>
              <label>
                Password
                <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={form.password} onChange={updateField} />
              </label>
              <label>
                Confirm password
                <input name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={updateField} />
              </label>
              {message && <p className="admin-error" role="alert">{message}</p>}
              <button className="admin-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create first administrator'}
              </button>
            </form>
          </>
        )}
        {created && <Link className="admin-primary-link" to="/login">Go to sign in</Link>}
        <Link className="admin-back-link" to="/login">Back to sign in</Link>
      </section>
    </main>
  )
}

export default AdminSetup
