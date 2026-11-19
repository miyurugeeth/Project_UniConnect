import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Image,
  LogOut,
  MessageSquareText,
  Pencil,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import PasswordChangeForm from './PasswordChangeForm'
import ProfessionalProfileEditForm from './ProfessionalProfileEditForm'
import ThemeToggle from '../components/ThemeToggle'
import NotificationBell from '../components/NotificationBell'
import './Dashboard.css'

function ProfessionalDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await api.get('/api/users/me', {
          signal: controller.signal,
        })
        if (
          response.data.role !== 'PROFESSIONAL' ||
          !response.data.professionalProfile
        ) {
          setErrorMessage('This account does not have a professional profile.')
          return
        }
        setProfile(response.data)
      } catch (error) {
        if (controller.signal.aborted) return

        if (error.response?.status === 401) {
          setErrorMessage('Your session expired. Please sign in again.')
        } else if (error.request && !error.response) {
          setErrorMessage(
            'Unable to reach UniConnect. Check that the backend is running and try again.',
          )
        } else {
          setErrorMessage('We could not load your profile. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [reloadKey])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function retryLoadingProfile() {
    setProfile(null)
    setImageFailed(false)
    setErrorMessage('')
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }

  const professional = profile?.professionalProfile
  const skills = Array.isArray(professional?.skills) ? professional.skills : []
  const initials =
    profile?.fullName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'
  const hasProfileImage = profile?.profileImageUrl && !imageFailed

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/" aria-label="UniConnect home">
          <span className="dashboard-brand__icon">
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <span>
            Uni<span>Connect</span>
          </span>
        </a>
        <div className="dashboard-header__actions">
          <Link className="dashboard-logout" to="/messages" aria-label="Messages">
            <MessageSquareText size={16} aria-hidden="true" />
            <span>Messages</span>
          </Link>
          <span className="dashboard-role">Professional space</span>
          <ThemeToggle />
          <NotificationBell />
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {isLoading ? (
          <section className="dashboard-state" aria-live="polite">
            <span className="dashboard-loader" aria-hidden="true" />
            <h1>Loading your professional profile</h1>
            <p>Getting your UniConnect space ready.</p>
          </section>
        ) : errorMessage ? (
          <section className="dashboard-state dashboard-state--error" role="alert">
            <span className="dashboard-state__icon">
              <RefreshCw size={22} aria-hidden="true" />
            </span>
            <h1>We couldn&apos;t load your profile</h1>
            <p>{errorMessage}</p>
            <button
              className="dashboard-primary-button"
              type="button"
              onClick={retryLoadingProfile}
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section className="dashboard-welcome">
              <div>
                <p className="dashboard-eyebrow">YOUR PROFESSIONAL SPACE</p>
                <h1>Welcome, {profile.fullName?.split(/\s+/)[0] || 'Professional'}.</h1>
                <p className="dashboard-welcome__copy">
                  Share your experience and grow your network.
                </p>
              </div>
              <button
                className="dashboard-edit-button"
                type="button"
                onClick={() => {
                  setEditMessage('')
                  setIsEditing(true)
                }}
              >
                <Pencil size={15} aria-hidden="true" />
                Edit profile
              </button>
            </section>

            {editMessage && (
              <p className="dashboard-notice" role="status">
                {editMessage}
              </p>
            )}

            {isEditing ? (
              <ProfessionalProfileEditForm
                profile={profile}
                onCancel={() => setIsEditing(false)}
                onSaved={(updatedProfile) => {
                  setProfile(updatedProfile)
                  setImageFailed(false)
                  setIsEditing(false)
                  setEditMessage('Your profile was updated successfully.')
                }}
              />
            ) : (
              <>
                <section className="profile-card" aria-label="Professional profile">
                  <div className="profile-card__identity">
                    {hasProfileImage ? (
                      <img
                        className="profile-avatar"
                        src={profile.profileImageUrl}
                        alt={`${profile.fullName}'s profile`}
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <div
                        className="profile-avatar profile-avatar--initials"
                        aria-hidden="true"
                      >
                        {initials}
                      </div>
                    )}
                    <div className="profile-card__name">
                      <span className="profile-role">
                        <BriefcaseBusiness size={14} aria-hidden="true" />
                        Professional
                      </span>
                      <h2>{profile.fullName}</h2>
                      <p>{profile.email}</p>
                    </div>
                    <span className="profile-card__badge">
                      <span />
                      Profile active
                    </span>
                  </div>

                  <div className="profile-card__details">
                    <div className="detail-item">
                      <span className="detail-item__icon">
                        <Building2 size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <span className="detail-label">Company</span>
                        <strong>{professional.companyName || 'Not provided'}</strong>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item__icon">
                        <BriefcaseBusiness size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <span className="detail-label">Industry</span>
                        <strong>{professional.industry || 'Not provided'}</strong>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item__icon">
                        <UserRound size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <span className="detail-label">Job position</span>
                        <strong>{professional.jobPosition || 'Not provided'}</strong>
                      </div>
                    </div>
                    {profile.profileImageUrl && (
                      <div className="detail-item">
                        <span className="detail-item__icon">
                          <Image size={17} aria-hidden="true" />
                        </span>
                        <div>
                          <span className="detail-label">Profile image URL</span>
                          <strong title={profile.profileImageUrl}>
                            {profile.profileImageUrl}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section
                  className="information-card professional-skills-card"
                  aria-label="Professional skills"
                >
                  <div className="information-card__heading">
                    <span className="information-card__icon">
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <h2>Skills</h2>
                      <p>Experience you bring to the community</p>
                    </div>
                    <ArrowUpRight
                      className="information-card__arrow"
                      size={17}
                      aria-hidden="true"
                    />
                  </div>
                  {skills.length > 0 ? (
                    <ul className="tag-list" aria-label="Skills">
                      {skills.map((skill) => (
                        <li className="profile-tag" key={skill}>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-list">No skills added yet.</p>
                  )}
                </section>
              </>
            )}

            <PasswordChangeForm />
          </>
        )}
      </div>
    </main>
  )
}

export default ProfessionalDashboard
