import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/useAuth'
import ThemeToggle from '../components/ThemeToggle'
import NotificationBell from '../components/NotificationBell'
import './SocialNetworking.css'

function StudentProfile() {
  const { studentId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)
  const [followError, setFollowError] = useState('')
  const [connectionsView, setConnectionsView] = useState('')
  const [connections, setConnections] = useState({ content: [], number: 0, totalPages: 0 })
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [connectionsError, setConnectionsError] = useState('')

  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const [coverBannerUrl, setCoverBannerUrl] = useState(null)
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false)
  const [isUploadingCoverBanner, setIsUploadingCoverBanner] = useState(false)
  const [profilePicError, setProfilePicError] = useState('')
  const [coverBannerError, setCoverBannerError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const response = await api.get(
          `/api/students/${encodeURIComponent(studentId)}`,
          { signal: controller.signal },
        )
        setProfile(response.data)
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error.response?.status === 404
              ? 'This student profile could not be found.'
              : 'We could not load this student profile. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [studentId])

  async function toggleFollow() {
    if (!profile || isUpdatingFollow) return
    setIsUpdatingFollow(true)
    setFollowError('')
    try {
      const response = profile.followedByCurrentUser
        ? await api.delete(`/api/students/${encodeURIComponent(studentId)}/follow`)
        : await api.post(`/api/students/${encodeURIComponent(studentId)}/follow`)
      setProfile((current) => ({
        ...current,
        followedByCurrentUser: response.data.following,
        followerCount: response.data.followerCount,
      }))
    } catch {
      setFollowError('We could not update this follow. Please try again.')
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  // Profile picture change handler
  async function handleProfilePictureChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setIsUploadingProfilePic(true)
    setProfilePicError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post(`/api/students/${studentId}/profile/picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfileImageUrl(response.data.storageKey)
      setProfilePicError('')
    } catch (error) {
      setProfilePicError(error.response?.data?.message || 'Failed to upload profile picture')
    } finally {
      setIsUploadingProfilePic(false)
      event.target.value = ''
    }
  }

  // Profile picture removal handler
  async function handleProfilePictureRemove() {
    setIsUploadingProfilePic(true)
    setProfilePicError('')

    try {
      await api.delete(`/api/students/${studentId}/profile/picture`)
      setProfileImageUrl(null)
      setProfilePicError('')
    } catch (error) {
      setProfilePicError(error.response?.data?.message || 'Failed to remove profile picture')
    } finally {
      setIsUploadingProfilePic(false)
    }
  }

  // Cover banner change handler
  async function handleCoverBannerChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setIsUploadingCoverBanner(true)
    setCoverBannerError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post(`/api/students/${studentId}/cover-banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCoverBannerUrl(response.data.storageKey)
      setCoverBannerError('')
    } catch (error) {
      setCoverBannerError(error.response?.data?.message || 'Failed to upload cover banner')
    } finally {
      setIsUploadingCoverBanner(false)
      event.target.value = ''
    }
  }

  // Cover banner removal handler
  async function handleCoverBannerRemove() {
    setIsUploadingCoverBanner(true)
    setCoverBannerError('')

    try {
      await api.delete(`/api/students/${studentId}/cover-banner`)
      setCoverBannerUrl(null)
      setCoverBannerError('')
    } catch (error) {
      setCoverBannerError(error.response?.data?.message || 'Failed to remove cover banner')
    } finally {
      setIsUploadingCoverBanner(false)
    }
  }

  async function loadConnections(view, page = 0) {
    setConnectionsView(view)
    setIsLoadingConnections(true)
    setConnectionsError('')
    try {
      const response = await api.get(
        `/api/students/${encodeURIComponent(studentId)}/${view}`,
        { params: { page, size: 20 } },
      )
      setConnections((current) => ({
        ...response.data,
        content:
          page === 0
            ? response.data.content
            : [...current.content, ...response.data.content],
      }))
    } catch {
      setConnectionsError('We could not load this list. Please try again.')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  return (
    <main className="social-page">
      <header className="social-header">
        <Link className="social-brand" to="/student/feed">
          Uni<span>Connect</span>
        </Link>
        <Link className="social-back-link" to="/student/feed">
          Back to feed
        </Link>
        <ThemeToggle />
      </header>
      <div className="social-content social-profile-content">
        {isLoading ? (
          <p className="social-empty" aria-live="polite">Loading student profile…</p>
        ) : errorMessage ? (
          <section className="social-card" role="alert">
            <p className="social-message social-message--error">{errorMessage}</p>
            <Link className="social-button social-button--link" to="/student/feed">
              Return to feed
            </Link>
          </section>
        ) : (
          <section className="social-card student-profile-card">
            <div className="student-profile-identity">
              {profile.profileImageUrl ? (
                <img
                  className="student-profile-avatar"
                  src={profile.profileImageUrl}
                  alt={`${profile.fullName}'s profile`}
                />
              ) : (
                <div className="student-profile-avatar student-profile-avatar--initials">
                  {profile.fullName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <div>
                <p className="social-eyebrow">STUDENT PROFILE</p>
                <h1>{profile.fullName}</h1>
                <p>
                  {[profile.universityName, profile.faculty, profile.departmentOrField]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
            <div className="student-profile-social">
              {user?.userId !== profile.id && (
                <>
                  <Link
                    className="social-button"
                    to={`/messages?userId=${encodeURIComponent(profile.id)}`}
                  >
                    Message
                  </Link>
                  <button
                    className="social-button"
                    type="button"
                    onClick={toggleFollow}
                    disabled={isUpdatingFollow}
                  >
                    {isUpdatingFollow
                      ? 'Updating…'
                      : profile.followedByCurrentUser
                        ? 'Unfollow'
                        : 'Follow'}
                  </button>
                </>
              )}
              <button
                className="social-text-button"
                type="button"
                onClick={() => loadConnections('followers')}
              >
                {profile.followerCount || 0} followers
              </button>
              <button
                className="social-text-button"
                type="button"
                onClick={() => loadConnections('following')}
              >
                {profile.followingCount || 0} following
              </button>
            </div>
            {followError && (
              <p className="social-message social-message--error" role="alert">
                {followError}
              </p>
            )}
            <dl className="student-profile-details">
              <div>
                <dt>Batch year</dt>
                <dd>{profile.batchYear}</dd>
              </div>
              <div>
                <dt>Academic year</dt>
                <dd>{profile.currentAcademicYear}</dd>
              </div>
              <div>
                <dt>Skills</dt>
                <dd>{profile.skills?.length ? profile.skills.join(', ') : 'Not provided'}</dd>
              </div>
              <div>
                <dt>Interests</dt>
                <dd>{profile.interests?.length ? profile.interests.join(', ') : 'Not provided'}</dd>
              </div>
            </dl>
            {connectionsView && (
              <section className="student-profile-connections" aria-label={connectionsView}>
                <h2>{connectionsView === 'followers' ? 'Followers' : 'Following'}</h2>
                {connectionsError && (
                  <p className="social-message social-message--error" role="alert">
                    {connectionsError}
                  </p>
                )}
                {connections.content.map((student) => (
                  <Link
                    className="student-result"
                    key={student.id}
                    to={`/student/profiles/${student.id}`}
                  >
                    <span className="student-result__name">{student.fullName}</span>
                    <span>
                      {[student.universityName, student.faculty, student.departmentOrField]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </Link>
                ))}
                {isLoadingConnections && (
                  <p className="social-empty" aria-live="polite">Loading students…</p>
                )}
                {!isLoadingConnections && connections.content.length === 0 && !connectionsError && (
                  <p className="social-empty">No students to show.</p>
                )}
                {connections.number + 1 < connections.totalPages && (
                  <button
                    className="social-button social-button--secondary"
                    type="button"
                    disabled={isLoadingConnections}
                    onClick={() => loadConnections(connectionsView, connections.number + 1)}
                  >
                    Load more
                  </button>
                )}
              </section>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default StudentProfile
