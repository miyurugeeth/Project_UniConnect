import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import './AdminDashboard.css'

const emptyAdminForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState({
    totalUsers: 0,
    administrators: 0,
    suspendedUsers: 0,
  })
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(emptyAdminForm)
  const [formMessage, setFormMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [busyUserId, setBusyUserId] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      api.get('/api/admin/users', {
        params: { page, size: 100 },
        signal: controller.signal,
      }),
      api.get('/api/admin/summary', { signal: controller.signal }),
    ])
      .then(([{ data: userPage }, { data: userSummary }]) => {
        setUsers(userPage.content || [])
        setTotalPages(userPage.totalPages || 0)
        setSummary(userSummary)
        setLoadError('')
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('We could not load administrator data. Please try again.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [page, reloadKey])

  function loadUsers() {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setFormMessage('')
  }

  async function createAdmin(event) {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setFormMessage('Passwords do not match.')
      return
    }
    setIsCreating(true)
    setFormMessage('')
    try {
      await api.post('/api/admin/users', form)
      setForm(emptyAdminForm)
      setFormMessage('Administrator account created.')
      setPage(0)
      setIsLoading(true)
      setReloadKey((current) => current + 1)
    } catch (error) {
      setFormMessage(
        error.response?.status === 409
          ? 'That email address or username is already in use.'
          : error.response?.data?.message || 'We could not create the administrator account.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleSuspension(account) {
    setBusyUserId(account.id)
    setLoadError('')
    try {
      const { data } = await api.put(`/api/admin/users/${account.id}/suspension`, {
        suspended: !account.suspended,
      })
      setUsers((current) => current.map((item) => item.id === data.id ? data : item))
      setSummary((current) => ({
        ...current,
        suspendedUsers: Math.max(
          0,
          current.suspendedUsers + (data.suspended ? 1 : -1),
        ),
      }))
    } catch {
      setLoadError(`Could not update ${account.fullName}'s account status.`)
    } finally {
      setBusyUserId('')
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-welcome">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h1>Admin dashboard</h1>
          <p>Manage accounts and keep the UniConnect community safe.</p>
        </div>
        <Link className="admin-primary-link" to="/student/feed">Open community feed</Link>
      </header>

      <section className="admin-stats" aria-label="Account overview">
        <article className="admin-panel admin-stat">
          <span>Total accounts</span>
          <strong>{isLoading ? '—' : summary.totalUsers}</strong>
        </article>
        <article className="admin-panel admin-stat">
          <span>Administrators</span>
          <strong>{isLoading ? '—' : summary.administrators}</strong>
        </article>
        <article className="admin-panel admin-stat">
          <span>Suspended accounts</span>
          <strong>{isLoading ? '—' : summary.suspendedUsers}</strong>
        </article>
      </section>

      <section className="admin-panel admin-accounts" aria-labelledby="accounts-title">
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">COMMUNITY SAFETY</p>
            <h2 id="accounts-title">User accounts</h2>
          </div>
          <button className="admin-secondary-button" type="button" onClick={loadUsers} disabled={isLoading}>
            Refresh
          </button>
        </div>
        {loadError && <p className="admin-error" role="alert">{loadError}</p>}
        {isLoading ? (
          <p className="admin-muted">Loading accounts…</p>
        ) : users.length === 0 ? (
          <p className="admin-muted">No user accounts were found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Username / email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td>{account.fullName}</td>
                    <td>
                      <strong>{account.username || '—'}</strong>
                      <span className="admin-table__email">{account.email}</span>
                    </td>
                    <td>{account.role.toLowerCase()}</td>
                    <td>
                      <span className={`admin-status${account.suspended ? ' admin-status--suspended' : ''}`}>
                        {account.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="admin-table__action">
                      {account.role !== 'ADMIN' && (
                        <button
                          className={account.suspended ? 'admin-secondary-button' : 'admin-danger-button'}
                          type="button"
                          disabled={busyUserId === account.id}
                          onClick={() => toggleSuspension(account)}
                        >
                          {busyUserId === account.id
                            ? 'Saving…'
                            : account.suspended ? 'Restore' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="User account pages">
            <button
              className="admin-secondary-button"
              type="button"
              disabled={page === 0 || isLoading}
              onClick={() => {
                setIsLoading(true)
                setPage((current) => Math.max(0, current - 1))
              }}
            >
              Previous
            </button>
            <span>Page {page + 1} of {totalPages}</span>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={page + 1 >= totalPages || isLoading}
              onClick={() => {
                setIsLoading(true)
                setPage((current) => current + 1)
              }}
            >
              Next
            </button>
          </nav>
        )}
      </section>

      <section className="admin-panel admin-create-admin" aria-labelledby="create-admin-title">
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">ACCESS CONTROL</p>
            <h2 id="create-admin-title">Add an administrator</h2>
          </div>
        </div>
        <p className="admin-muted">
          Only an authenticated administrator can create another administrator account.
        </p>
        <form className="admin-form admin-form--grid" onSubmit={createAdmin}>
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
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={form.password} onChange={updateField} />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={updateField} />
          </label>
          <div className="admin-form__submit">
            {formMessage && <p className="admin-notice" role="status">{formMessage}</p>}
            <button className="admin-primary-button" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create administrator'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AdminDashboard
