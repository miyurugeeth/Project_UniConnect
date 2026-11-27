import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Heart,
  Pencil,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { api } from '../services/api'
import PasswordChangeForm from './PasswordChangeForm'
import StudentProfileEditForm from './StudentProfileEditForm'
import './Dashboard.css'

function StudentDashboard() {
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
        if (response.data.role !== 'STUDENT') {
          setErrorMessage('This account does not have a student profile.')
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

  function retryLoadingProfile() {
    setProfile(null)
    setImageFailed(false)
    setErrorMessage('')
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }

  const student = profile?.studentProfile
  const skills = Array.isArray(student?.skills) ? student.skills : []
  const interests = Array.isArray(student?.interests) ? student.interests : []
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
      <div className="dashboard-content">
        {isLoading ? (
          <section className="dashboard-state" aria-live="polite">
            <span className="dashboard-loader" aria-hidden="true" />
            <h1>Loading your student profile</h1>
            <p>Getting your UniConnect space ready.</p>
          </section>
        ) : errorMessage ? (
          <section className="dashboard-state dashboard-state--error" role="alert">
            <span className="dashboard-state__icon">
              <RefreshCw size={22} aria-hidden="true" />
            </span>
            <h1>We couldn&apos;t load your profile</h1>
            <p>{errorMessage}</p>
            <button className="dashboard-primary-button" type="button" onClick={retryLoadingProfile}>
              Try again
            </button>
          </section>
        ) : (
          <>
            <section className="dashboard-welcome">
              <div>
                <p className="dashboard-eyebrow">YOUR STUDENT SPACE</p>
                <h1>Welcome, {profile.fullName?.split(/\s+/)[0] || 'Student'}.</h1>
                <p className="dashboard-welcome__copy">
                  Your university journey, all in one place.
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
              <StudentProfileEditForm
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
                <section className="profile-card" aria-label="Student profile">
              <div className="profile-card__identity">
                {hasProfileImage ? (
                  <img
                    className="profile-avatar"
                    src={profile.profileImageUrl}
                    alt={`${profile.fullName}'s profile`}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="profile-avatar profile-avatar--initials" aria-hidden="true">
                    {initials}
                  </div>
                )}
                <div className="profile-card__name">
                  <span className="profile-role">
                    <GraduationCap size={14} aria-hidden="true" />
                    Student
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
                    <GraduationCap size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="detail-label">University</span>
                    <strong>{student?.universityName || 'Not provided'}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-item__icon">
                    <BookOpen size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="detail-label">Faculty</span>
                    <strong>{student?.faculty || 'Not provided'}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-item__icon">
                    <UserRound size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="detail-label">Department / field</span>
                    <strong>{student?.departmentOrField || 'Not provided'}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-item__icon">
                    <CalendarDays size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="detail-label">Batch year</span>
                    <strong>{student?.batchYear ?? 'Not provided'}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-item__icon">
                    <BookOpen size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="detail-label">Current academic year</span>
                    <strong>
                      {student?.currentAcademicYear
                        ? `Year ${student.currentAcademicYear}`
                        : 'Not provided'}
                    </strong>
                  </div>
                </div>
              </div>
                </section>

                <div className="profile-lists">
              <section className="information-card">
                <div className="information-card__heading">
                  <span className="information-card__icon">
                    <BriefcaseBusiness size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>Skills</h2>
                    <p>What you bring to the community</p>
                  </div>
                  <ArrowUpRight className="information-card__arrow" size={17} aria-hidden="true" />
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

              <section className="information-card">
                <div className="information-card__heading">
                  <span className="information-card__icon information-card__icon--gold">
                    <Heart size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>Interests</h2>
                    <p>Topics you&apos;re curious about</p>
                  </div>
                  <ArrowUpRight className="information-card__arrow" size={17} aria-hidden="true" />
                </div>
                {interests.length > 0 ? (
                  <ul className="tag-list" aria-label="Interests">
                    {interests.map((interest) => (
                      <li className="profile-tag profile-tag--gold" key={interest}>
                        {interest}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-list">No interests added yet.</p>
                )}
              </section>
                </div>
              </>
            )}

            <PasswordChangeForm />
          </>
        )}
      </div>
    </main>
  )
}

export default StudentDashboard
