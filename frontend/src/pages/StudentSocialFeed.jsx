import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/useAuth'
import './SocialNetworking.css'

const PAGE_SIZE = 10
const COMMENT_PAGE_SIZE = 10
const MAX_ATTACHMENTS = 5
const MAX_VIDEOS = 1
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])
const ACCEPTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const ACCEPTED_DOCUMENT_TYPES = new Set(['application/pdf'])

function ProtectedPostMedia({ attachment }) {
  const [mediaUrl, setMediaUrl] = useState('')
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''

    async function loadMedia() {
      try {
        const response = await api.get(attachment.contentUrl, {
          responseType: 'blob',
          signal: controller.signal,
        })
        objectUrl = URL.createObjectURL(response.data)
        setMediaUrl(objectUrl)
      } catch {
        if (!controller.signal.aborted) setLoadError(true)
      }
    }

    loadMedia()
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment.contentUrl])

  if (loadError) {
    return <p className="social-message social-message--error">This attachment could not be loaded.</p>
  }
  if (!mediaUrl) return <p className="social-media-loading">Loading attachment…</p>

  if (attachment.mediaType === 'PDF') {
    return (
      <>
        <iframe
          className="social-post__document"
          src={mediaUrl}
          title="Post PDF attachment"
        />
        <a className="social-document-link" href={mediaUrl} download="attachment.pdf">
          Open or download PDF
        </a>
      </>
    )
  }

  return attachment.mediaType === 'VIDEO' ? (
    <video className="social-post__video" controls preload="metadata">
      <source src={mediaUrl} type={attachment.contentType} />
      Your browser does not support video playback.
    </video>
  ) : (
    <img className="social-post__image" src={mediaUrl} alt="Post attachment" />
  )
}

function StudentSocialFeed() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [searchParams, setSearchParams] = useSearchParams()
  const mineOnly = searchParams.get('mine') === 'true'
  const connectionsView = searchParams.get('view') === 'connections'
  const isComposerOpen = searchParams.get('compose') === 'true'
  const [feed, setFeed] = useState({ content: [], number: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [categories, setCategories] = useState([])
  const [postCategoryCode, setPostCategoryCode] = useState('')
  const [feedCategoryCode, setFeedCategoryCode] = useState('')
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [editingPostId, setEditingPostId] = useState(null)
  const [editScrollRequest, setEditScrollRequest] = useState(0)
  const [selectedAttachments, setSelectedAttachments] = useState([])
  const [retainedAttachments, setRetainedAttachments] = useState([])
  const postComposerRef = useRef(null)
  const postContentInputRef = useRef(null)
  const selectedAttachmentUrls = useRef(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [postMessage, setPostMessage] = useState('')
  const [postMessageIsError, setPostMessageIsError] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [attachmentMessage, setAttachmentMessage] = useState('')
  const [busyLikeIds, setBusyLikeIds] = useState(() => new Set())
  const [openCommentPostIds, setOpenCommentPostIds] = useState(() => new Set())
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentErrors, setCommentErrors] = useState({})
  const [loadingCommentsFor, setLoadingCommentsFor] = useState(() => new Set())
  const [savingCommentsFor, setSavingCommentsFor] = useState(() => new Set())
  const [editingComment, setEditingComment] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfileSummary() {
      try {
        const response = await api.get('/api/users/me', { signal: controller.signal })
        setMyProfile(response.data)
        setProfileError('')
      } catch {
        if (!controller.signal.aborted) {
          setProfileError('Your profile details could not be loaded.')
        }
      }
    }

    loadProfileSummary()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCategories() {
      setIsLoadingCategories(true)
      setCategoriesError('')
      try {
        const response = await api.get('/api/students/categories', {
          signal: controller.signal,
        })
        setCategories(response.data)
      } catch {
        if (!controller.signal.aborted) {
          setCategoriesError('We could not load post categories. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingCategories(false)
      }
    }

    loadCategories()
    return () => controller.abort()
  }, [categoriesReloadKey])

  useEffect(() => {
    const controller = new AbortController()

    async function loadFeed() {
      setIsLoading(true)
      setFeedError('')
      try {
        const response = await api.get('/api/students/feed', {
          params: {
            page,
            size: PAGE_SIZE,
            ...(mineOnly ? { mine: true } : {}),
            ...(feedCategoryCode ? { category: feedCategoryCode } : {}),
          },
          signal: controller.signal,
        })
        setFeed(response.data)
      } catch (error) {
        if (!controller.signal.aborted) {
          setFeedError(
            error.response?.status === 401
              ? 'Your session expired. Please sign in again.'
              : 'We could not load the community feed. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadFeed()
    return () => controller.abort()
  }, [page, reloadKey, feedCategoryCode, mineOnly])

  useEffect(() => {
    if (!editScrollRequest || !editingPostId || !isComposerOpen) return

    postComposerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    postContentInputRef.current?.focus({ preventScroll: true })
  }, [editScrollRequest, editingPostId, isComposerOpen])

  useEffect(() => {
    if (isComposerOpen && !editingPostId) {
      postContentInputRef.current?.focus({ preventScroll: true })
    }
  }, [isComposerOpen, editingPostId])

  useEffect(
    () => () => {
      selectedAttachmentUrls.current.forEach((url) => URL.revokeObjectURL(url))
      selectedAttachmentUrls.current.clear()
    },
    [],
  )

  function clearSelectedAttachments() {
    selectedAttachmentUrls.current.forEach((url) => URL.revokeObjectURL(url))
    selectedAttachmentUrls.current.clear()
    setSelectedAttachments([])
  }

  function setComposerOpen(open) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (open) {
          next.set('compose', 'true')
        } else {
          next.delete('compose')
        }
        return next
      },
      { replace: !open },
    )
  }

  function handleAttachmentSelection(event) {
    setAttachmentMessage('')
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const currentCount = retainedAttachments.length + selectedAttachments.length
    const remainingSlots = MAX_ATTACHMENTS - currentCount
    if (files.length > remainingSlots) {
      setAttachmentMessage(`A post can have up to ${MAX_ATTACHMENTS} attachments.`)
    }

    const accepted = []
    let videoCount =
      retainedAttachments.filter((attachment) => attachment.mediaType === 'VIDEO').length +
      selectedAttachments.filter((item) => ACCEPTED_VIDEO_TYPES.has(item.file.type)).length

    for (const file of files.slice(0, Math.max(remainingSlots, 0))) {
      const isImage = ACCEPTED_IMAGE_TYPES.has(file.type)
      const isVideo = ACCEPTED_VIDEO_TYPES.has(file.type)
      const isDocument = ACCEPTED_DOCUMENT_TYPES.has(file.type)
      if (!isImage && !isVideo && !isDocument) {
        setAttachmentMessage('Use JPEG, PNG, GIF, MP4, WebM, or PDF files only.')
        continue
      }
      if (
        (isImage && file.size > MAX_IMAGE_BYTES) ||
        ((isVideo || isDocument) && file.size > MAX_VIDEO_BYTES)
      ) {
        setAttachmentMessage(
          isImage
            ? 'Images must be 10 MiB or smaller.'
            : 'Videos and PDFs must be 100 MiB or smaller.',
        )
        continue
      }
      if (isVideo && videoCount >= MAX_VIDEOS) {
        setAttachmentMessage(`A post can have up to ${MAX_VIDEOS} video.`)
        continue
      }
      if (isVideo) videoCount += 1
      const previewUrl = URL.createObjectURL(file)
      selectedAttachmentUrls.current.add(previewUrl)
      accepted.push({ file, previewUrl })
    }

    if (accepted.length) {
      setSelectedAttachments((current) => [...current, ...accepted])
    }
  }

  function removeSelectedAttachment(previewUrl) {
    URL.revokeObjectURL(previewUrl)
    selectedAttachmentUrls.current.delete(previewUrl)
    setSelectedAttachments((current) =>
      current.filter((attachment) => attachment.previewUrl !== previewUrl),
    )
  }

  function removeRetainedAttachment(attachmentId) {
    setRetainedAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    )
  }

  async function handlePostSubmit(event) {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setPostMessage('')
    setPostMessageIsError(false)
    const request = {
      content: content.trim(),
      imageUrl: imageUrl.trim() || null,
      categoryCode: postCategoryCode,
    }
    const formData = new FormData()
    formData.append('post', new Blob([JSON.stringify(request)], { type: 'application/json' }), 'post.json')
    selectedAttachments.forEach(({ file }) => formData.append('attachments', file))
    const queryParams = new URLSearchParams()
    retainedAttachments.forEach((attachment) =>
      queryParams.append('retainedAttachmentIds', attachment.id),
    )
    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''

    try {
      if (editingPostId) {
        await api.put(`/api/students/posts/${editingPostId}${suffix}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/api/students/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      clearSelectedAttachments()
      setContent('')
      setImageUrl('')
      setPostCategoryCode('')
      setRetainedAttachments([])
      setEditingPostId(null)
      setPage(0)
      setReloadKey((current) => current + 1)
      setPostMessage('Your post was published.')
    } catch (error) {
      setPostMessageIsError(true)
      setPostMessage(
        error.response?.status === 400
          ? 'Check your post text, category, attachments, and image URL, then try again.'
          : error.response?.status === 413
            ? 'The selected attachments exceed the upload limit.'
            : 'We could not save your post. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(postId) {
    setPostMessage('')
    try {
      await api.delete(
        isAdmin ? `/api/admin/posts/${postId}` : `/api/students/posts/${postId}`,
      )
      if (editingPostId === postId) cancelEditing()
      if (page > 0 && feed.content.length === 1) {
        setPage((current) => Math.max(0, current - 1))
      } else {
        setReloadKey((current) => current + 1)
      }
    } catch {
      setPostMessageIsError(true)
      setPostMessage('We could not delete your post. Please try again.')
    }
  }

  function startEditing(post) {
    setComposerOpen(true)
    clearSelectedAttachments()
    setEditingPostId(post.id)
    setContent(post.content)
    setImageUrl(post.imageUrl || '')
    setPostCategoryCode(post.category?.code || '')
    setRetainedAttachments(post.attachments || [])
    setAttachmentMessage('')
    setPostMessage('')
    setPostMessageIsError(false)
    setEditScrollRequest((current) => current + 1)
  }

  function cancelEditing() {
    setComposerOpen(false)
    clearSelectedAttachments()
    setEditingPostId(null)
    setContent('')
    setImageUrl('')
    setPostCategoryCode('')
    setRetainedAttachments([])
    setAttachmentMessage('')
    setPostMessage('')
  }

  async function handleSearch(event) {
    event.preventDefault()
    const searchTerm = query.trim()
    if (!searchTerm) {
      setSearchMessage('Enter a name, university, faculty, or department to search.')
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setSearchMessage('')
    try {
      const response = await api.get('/api/students/search', {
        params: { q: searchTerm, page: 0, size: PAGE_SIZE },
      })
      setSearchResults(response.data.content || [])
      setHasSearched(true)
    } catch {
      setSearchResults([])
      setHasSearched(false)
      setSearchMessage('We could not search students. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  function updatePost(postId, update) {
    setFeed((current) => ({
      ...current,
      content: current.content.map((post) =>
        post.id === postId ? { ...post, ...update } : post,
      ),
    }))
  }

  async function handleLike(post) {
    if (busyLikeIds.has(post.id)) return
    setBusyLikeIds((current) => new Set(current).add(post.id))
    try {
      const response = post.likedByCurrentUser
        ? await api.delete(`/api/students/posts/${post.id}/likes`)
        : await api.post(`/api/students/posts/${post.id}/likes`)
      updatePost(post.id, response.data)
    } catch {
      setFeedError('We could not update your like. Please try again.')
    } finally {
      setBusyLikeIds((current) => {
        const next = new Set(current)
        next.delete(post.id)
        return next
      })
    }
  }

  async function loadComments(postId, requestedPage = 0) {
    setLoadingCommentsFor((current) => new Set(current).add(postId))
    setCommentErrors((current) => ({ ...current, [postId]: '' }))
    try {
      const response = await api.get(`/api/students/posts/${postId}/comments`, {
        params: { page: requestedPage, size: COMMENT_PAGE_SIZE },
      })
      setCommentsByPost((current) => ({
        ...current,
        [postId]: {
          ...response.data,
          content:
            requestedPage === 0
              ? response.data.content
              : [...(current[postId]?.content || []), ...response.data.content],
        },
      }))
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [postId]: 'We could not load comments. Please try again.',
      }))
    } finally {
      setLoadingCommentsFor((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
    }
  }

  function toggleComments(postId) {
    if (openCommentPostIds.has(postId)) {
      setOpenCommentPostIds((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
      return
    }
    setOpenCommentPostIds((current) => new Set(current).add(postId))
    if (!commentsByPost[postId]) loadComments(postId)
  }

  async function submitComment(postId, event) {
    event.preventDefault()
    const commentContent = (commentDrafts[postId] || '').trim()
    if (!commentContent || savingCommentsFor.has(postId)) return
    setSavingCommentsFor((current) => new Set(current).add(postId))
    setCommentErrors((current) => ({ ...current, [postId]: '' }))
    try {
      await api.post(`/api/students/posts/${postId}/comments`, { content: commentContent })
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
      const currentCount = Number(
        feed.content.find((post) => post.id === postId)?.commentCount || 0,
      )
      updatePost(postId, { commentCount: currentCount + 1 })
      await loadComments(postId)
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [postId]: 'We could not add your comment. Please try again.',
      }))
    } finally {
      setSavingCommentsFor((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
    }
  }

  async function saveComment(postId, commentId, commentContent) {
    if (!commentContent.trim()) return
    setSavingCommentsFor((current) => new Set(current).add(postId))
    try {
      await api.put(`/api/students/posts/${postId}/comments/${commentId}`, {
        content: commentContent.trim(),
      })
      setEditingComment(null)
      await loadComments(postId)
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [postId]: 'We could not update your comment. Please try again.',
      }))
    } finally {
      setSavingCommentsFor((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
    }
  }

  async function deleteComment(postId, commentId) {
    setSavingCommentsFor((current) => new Set(current).add(postId))
    try {
      await api.delete(
        isAdmin
          ? `/api/admin/posts/${postId}/comments/${commentId}`
          : `/api/students/posts/${postId}/comments/${commentId}`,
      )
      const currentCount = Number(
        feed.content.find((post) => post.id === postId)?.commentCount || 0,
      )
      updatePost(postId, { commentCount: Math.max(0, currentCount - 1) })
      await loadComments(postId)
    } catch {
      setCommentErrors((current) => ({
        ...current,
        [postId]: 'We could not delete your comment. Please try again.',
      }))
    } finally {
      setSavingCommentsFor((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
    }
  }

  const selectedVideoCount = selectedAttachments.filter(({ file }) =>
    ACCEPTED_VIDEO_TYPES.has(file.type),
  ).length
  const retainedVideoCount = retainedAttachments.filter(
    (attachment) => attachment.mediaType === 'VIDEO',
  ).length
  const submitDisabled =
    isSaving ||
    isLoadingCategories ||
    categories.length === 0 ||
    retainedAttachments.length + selectedAttachments.length > MAX_ATTACHMENTS ||
    retainedVideoCount + selectedVideoCount > MAX_VIDEOS
  const profileDetails =
    myProfile?.studentProfile || myProfile?.professionalProfile || null
  const profileImageUrl = myProfile?.profileImageUrl || user?.profileImageUrl
  const profileSummary =
    user?.role === 'PROFESSIONAL'
      ? [
          profileDetails?.jobPosition,
          profileDetails?.companyName,
        ].filter(Boolean).join(' · ')
      : [
          profileDetails?.faculty,
          profileDetails?.universityName,
          profileDetails?.batchYear ? `Batch ${profileDetails.batchYear}` : null,
        ].filter(Boolean).join(' · ')

  return (
    <main className="social-page">
      <div className="social-content">
        {!connectionsView && (
          <>
            <section className="social-intro social-welcome">
              <div>
                <p className="social-eyebrow">YOUR UNICONNECT COMMUNITY</p>
                <h1>Your university journey, connected.</h1>
                <p>Share an update, find inspiration, and grow with your community.</p>
              </div>
              <button
                className="social-button social-welcome__create"
                type="button"
                onClick={() => setComposerOpen(true)}
              >
                Create post
              </button>
            </section>

            <section className="social-card social-member-summary" aria-label="Your profile summary">
              {profileImageUrl ? (
                <img
                  className="social-member-summary__avatar"
                  src={profileImageUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : (
                <span className="social-member-summary__avatar" aria-hidden="true">
                  {(myProfile?.fullName || user?.fullName || 'U')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
              <div className="social-member-summary__details">
                <p className="social-member-summary__label">WELCOME BACK</p>
                <strong>{myProfile?.fullName || user?.fullName || 'UniConnect member'}</strong>
                {profileSummary && <span>{profileSummary}</span>}
                {profileError && (
                  <span className="social-message social-message--error" role="status">
                    {profileError}
                  </span>
                )}
              </div>
            </section>
          </>
        )}

        {connectionsView && (
          <section className="social-card social-search" aria-labelledby="search-title" id="people-search">
            <p className="social-eyebrow">YOUR UNICONNECT COMMUNITY</p>
            <h1 id="search-title">Connections</h1>
            <p className="social-connections__description">
              Find students by name, university, faculty, or department.
            </p>
            <form className="social-search-form" onSubmit={handleSearch}>
              <label className="visually-hidden" htmlFor="student-search">
                Search students
              </label>
              <input
                id="student-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, university, faculty, or department"
              />
              <button className="social-button" type="submit" disabled={isSearching}>
                {isSearching ? 'Searching…' : 'Search'}
              </button>
            </form>
            {searchMessage && (
              <p className="social-message social-message--error" role="alert">
                {searchMessage}
              </p>
            )}
            {hasSearched && (
              <div className="social-search-results" aria-live="polite">
                {searchResults.length ? (
                  searchResults.map((student) => (
                    <Link
                      className="student-result"
                      key={student.id}
                      to={
                        user?.role === 'STUDENT'
                          ? `/student/profiles/${student.id}`
                          : `/messages?userId=${encodeURIComponent(student.id)}`
                      }
                    >
                      <span className="student-result__name">{student.fullName}</span>
                      <span>
                        {[student.universityName, student.faculty, student.departmentOrField]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="social-empty">No students matched that search.</p>
                )}
              </div>
            )}
          </section>
        )}

        {!isComposerOpen && postMessage && (
          <p
            className={`social-message ${postMessageIsError ? 'social-message--error' : 'social-message--success'}`}
            role={postMessageIsError ? 'alert' : 'status'}
          >
            {postMessage}
          </p>
        )}

        {isComposerOpen && !connectionsView && (
          <div className="social-modal-backdrop" role="presentation">
            <section
              className="social-card social-composer social-composer-dialog"
              aria-labelledby="composer-title"
              id="create-post"
              ref={postComposerRef}
              role="dialog"
              aria-modal="true"
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !isSaving) {
                  if (editingPostId) cancelEditing()
                  else setComposerOpen(false)
                }
              }}
            >
              <div className="social-composer__heading">
                <h2 id="composer-title">{editingPostId ? 'Edit your post' : 'Create a post'}</h2>
                <button
                  className="social-composer__close"
                  type="button"
                  aria-label="Close post composer"
                  onClick={() => {
                    if (editingPostId) cancelEditing()
                    else setComposerOpen(false)
                  }}
                  disabled={isSaving}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handlePostSubmit}>
            <label className="social-label" htmlFor="post-content">
              Post text
            </label>
            <textarea
              id="post-content"
              ref={postContentInputRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={5000}
              required
              rows={4}
              placeholder={`What's on your mind${user?.fullName ? `, ${user.fullName.split(/\s+/)[0]}` : ''}?`}
            />
            <label className="social-label" htmlFor="post-category">
              Post category
            </label>
            <select
              id="post-category"
              value={postCategoryCode}
              onChange={(event) => setPostCategoryCode(event.target.value)}
              required
              disabled={isLoadingCategories || categories.length === 0}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category.code} value={category.code}>
                  {category.displayName}
                </option>
              ))}
            </select>
            {categoriesError && (
              <p className="social-message social-message--error" role="alert">
                {categoriesError}{' '}
                <button
                  className="social-text-button"
                  type="button"
                  onClick={() => setCategoriesReloadKey((current) => current + 1)}
                >
                  Retry
                </button>
              </p>
            )}
            <label className="social-label" htmlFor="post-image-url">
              Legacy image URL (optional)
            </label>
            <input
              id="post-image-url"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              maxLength={2048}
              placeholder="https://example.com/image.jpg"
            />
            <label className="social-label" htmlFor="post-attachments">
              Photos, videos, or PDFs
            </label>
            <input
              id="post-attachments"
              type="file"
              accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,application/pdf"
              multiple
              onChange={handleAttachmentSelection}
              disabled={retainedAttachments.length + selectedAttachments.length >= MAX_ATTACHMENTS}
            />
            <p className="social-upload-help">
              Up to {MAX_ATTACHMENTS} attachments, including {MAX_VIDEOS} video. Images up to 10 MiB;
              videos and PDFs up to 100 MiB.
            </p>
            {attachmentMessage && (
              <p className="social-message social-message--error" role="alert">
                {attachmentMessage}
              </p>
            )}
            {(retainedAttachments.length > 0 || selectedAttachments.length > 0) && (
              <div className="social-attachment-preview" aria-label="Selected attachments">
                {retainedAttachments.map((attachment) => (
                  <div className="social-attachment-preview__item" key={attachment.id}>
                    <ProtectedPostMedia attachment={attachment} />
                    <button
                      className="social-text-button social-text-button--danger"
                      type="button"
                      onClick={() => removeRetainedAttachment(attachment.id)}
                    >
                      Remove existing attachment
                    </button>
                  </div>
                ))}
                {selectedAttachments.map(({ file, previewUrl }) => (
                  <div className="social-attachment-preview__item" key={previewUrl}>
                    {ACCEPTED_DOCUMENT_TYPES.has(file.type) ? (
                      <>
                        <iframe
                          className="social-post__document"
                          src={previewUrl}
                          title={`PDF preview: ${file.name}`}
                        />
                        <a className="social-document-link" href={previewUrl} download={file.name}>
                          Open or download {file.name}
                        </a>
                      </>
                    ) : ACCEPTED_VIDEO_TYPES.has(file.type) ? (
                      <video className="social-post__video" controls src={previewUrl} />
                    ) : (
                      <img className="social-post__image" src={previewUrl} alt="Selected preview" />
                    )}
                    <button
                      className="social-text-button social-text-button--danger"
                      type="button"
                      onClick={() => removeSelectedAttachment(previewUrl)}
                    >
                      Remove selected attachment
                    </button>
                  </div>
                ))}
              </div>
            )}
            {postMessage && (
              <p
                className={`social-message ${postMessageIsError ? 'social-message--error' : 'social-message--success'}`}
                role={postMessageIsError ? 'alert' : 'status'}
              >
                {postMessage}
              </p>
            )}
            <div className="social-actions">
              {editingPostId && (
                <button
                  className="social-button social-button--secondary"
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  Cancel edit
                </button>
              )}
              <button className="social-button" type="submit" disabled={submitDisabled}>
                {isSaving ? 'Saving…' : editingPostId ? 'Save changes' : 'Publish post'}
              </button>
            </div>
              </form>
            </section>
          </div>
        )}

        {!connectionsView && (
          <section className="social-feed" aria-labelledby="feed-title">
          <div className="social-feed__heading">
            <div className="social-feed__title">
              <h2 id="feed-title">{mineOnly ? 'My posts' : 'Latest Posts'}</h2>
              {!mineOnly && (
                <span className="social-feed__count">
                  {feed.totalElements ?? feed.content?.length ?? 0} posts
                </span>
              )}
            </div>
            {mineOnly && (
              <Link className="social-button social-button--secondary" to="/student/feed">
                View community feed
              </Link>
            )}
          </div>
          <label className="social-label" htmlFor="feed-category">
            Filter by category
          </label>
          <select
            id="feed-category"
            value={feedCategoryCode}
            onChange={(event) => {
              setPage(0)
              setFeedCategoryCode(event.target.value)
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.code} value={category.code}>
                {category.displayName}
              </option>
            ))}
          </select>
          {isLoading ? (
            <p className="social-empty" aria-live="polite">
              Loading posts…
            </p>
          ) : feedError ? (
            <div className="social-card" role="alert">
              <p className="social-message social-message--error">{feedError}</p>
              <button
                className="social-button"
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Try again
              </button>
            </div>
          ) : feed.content?.length ? (
            <>
              <div className="social-post-list">
                {feed.content.map((post) => (
                  <article className="social-card social-post" key={post.id}>
                    <div className="social-post__author">
                      {user?.role === 'STUDENT' && post.author.role === 'STUDENT' ? (
                        <Link to={`/student/profiles/${post.author.id}`}>
                          {post.author.fullName}
                        </Link>
                      ) : (
                        <strong>{post.author.fullName}</strong>
                      )}
                      <span className="social-post__role">
                      {post.author.role === 'PROFESSIONAL'
                        ? 'Industry professional'
                        : post.author.role === 'ADMIN'
                          ? 'Administrator'
                          : 'University student'}
                      </span>
                      <span>
                        {[
                          post.author.role === 'PROFESSIONAL'
                            ? post.author.jobPosition
                            : post.author.faculty,
                          post.author.role === 'PROFESSIONAL'
                            ? post.author.companyName
                            : post.author.universityName,
                          post.author.role === 'PROFESSIONAL' ? post.author.industry : null,
                        ].filter(Boolean)
                          .join(' · ')}
                      </span>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleString()}
                      </time>
                    </div>
                    {post.category?.displayName && (
                      <p className="social-post__category">{post.category.displayName}</p>
                    )}
                    <p className="social-post__content">{post.content}</p>
                    {post.imageUrl && (
                      <img className="social-post__image" src={post.imageUrl} alt="Post" />
                    )}
                    {(post.attachments || []).map((attachment) => (
                      <ProtectedPostMedia key={attachment.id} attachment={attachment} />
                    ))}
                    <div className="social-post__engagement">
                      <button
                        className={`social-text-button ${post.likedByCurrentUser ? 'social-text-button--liked' : ''}`}
                        type="button"
                        disabled={busyLikeIds.has(post.id)}
                        onClick={() => handleLike(post)}
                      >
                        {post.likedByCurrentUser ? 'Unlike' : 'Like'} · {post.likeCount || 0}
                      </button>
                      <button
                        className="social-text-button"
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        aria-expanded={openCommentPostIds.has(post.id)}
                      >
                        {openCommentPostIds.has(post.id) ? 'Hide comments' : 'Comments'} ·{' '}
                        {post.commentCount || 0}
                      </button>
                    </div>
                    {openCommentPostIds.has(post.id) && (
                      <section className="social-comments" aria-label="Post comments">
                        {commentErrors[post.id] && (
                          <p className="social-message social-message--error" role="alert">
                            {commentErrors[post.id]}
                          </p>
                        )}
                        {loadingCommentsFor.has(post.id) && !commentsByPost[post.id] ? (
                          <p className="social-empty">Loading comments…</p>
                        ) : (
                          <>
                            <div className="social-comment-list">
                              {(commentsByPost[post.id]?.content || []).map((comment) => (
                                <article className="social-comment" key={comment.id}>
                                  <div className="social-comment__heading">
                                    {user?.role === 'STUDENT' && comment.author.role === 'STUDENT' ? (
                                      <Link to={`/student/profiles/${comment.author.id}`}>
                                        {comment.author.fullName}
                                      </Link>
                                    ) : (
                                      <strong>{comment.author.fullName}</strong>
                                    )}
                                    <time dateTime={comment.createdAt}>
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </time>
                                  </div>
                                  {editingComment?.id === comment.id ? (
                                    <form
                                      onSubmit={(event) => {
                                        event.preventDefault()
                                        saveComment(post.id, comment.id, editingComment.content)
                                      }}
                                    >
                                      <textarea
                                        aria-label="Edit comment"
                                        maxLength={2000}
                                        required
                                        value={editingComment.content}
                                        onChange={(event) =>
                                          setEditingComment((current) => ({
                                            ...current,
                                            content: event.target.value,
                                          }))
                                        }
                                      />
                                      <div className="social-comment__actions">
                                        <button className="social-text-button" type="submit">
                                          Save comment
                                        </button>
                                        <button
                                          className="social-text-button"
                                          type="button"
                                          onClick={() => setEditingComment(null)}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <p>{comment.content}</p>
                                  )}
                                  {(isAdmin || comment.author.id === user?.userId) &&
                                    editingComment?.id !== comment.id && (
                                      <div className="social-comment__actions">
                                        <button
                                          className="social-text-button"
                                          type="button"
                                          onClick={() =>
                                            setEditingComment({
                                              id: comment.id,
                                              content: comment.content,
                                            })
                                          }
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="social-text-button social-text-button--danger"
                                          type="button"
                                          disabled={savingCommentsFor.has(post.id)}
                                          onClick={() => deleteComment(post.id, comment.id)}
                                        >
                                          {isAdmin ? 'Remove' : 'Delete'}
                                        </button>
                                      </div>
                                    )}
                                </article>
                              ))}
                            </div>
                            {commentsByPost[post.id]?.number + 1 <
                              commentsByPost[post.id]?.totalPages && (
                              <button
                                className="social-button social-button--secondary"
                                type="button"
                                disabled={loadingCommentsFor.has(post.id)}
                                onClick={() =>
                                  loadComments(
                                    post.id,
                                    (commentsByPost[post.id]?.number || 0) + 1,
                                  )
                                }
                              >
                                {loadingCommentsFor.has(post.id)
                                  ? 'Loading…'
                                  : 'Load more comments'}
                              </button>
                            )}
                          </>
                        )}
                        <form
                          className="social-comment-form"
                          onSubmit={(event) => submitComment(post.id, event)}
                        >
                          <label className="visually-hidden" htmlFor={`comment-${post.id}`}>
                            Add a comment
                          </label>
                          <textarea
                            id={`comment-${post.id}`}
                            maxLength={2000}
                            required
                            value={commentDrafts[post.id] || ''}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [post.id]: event.target.value,
                              }))
                            }
                            placeholder="Write a comment…"
                          />
                          <button
                            className="social-button"
                            type="submit"
                            disabled={
                              savingCommentsFor.has(post.id) ||
                              !(commentDrafts[post.id] || '').trim()
                            }
                          >
                            {savingCommentsFor.has(post.id) ? 'Saving…' : 'Comment'}
                          </button>
                        </form>
                      </section>
                    )}
                    {(isAdmin || post.author.id === user?.userId) && (
                      <div className="social-post__controls">
                        <button
                          className="social-text-button"
                          type="button"
                          onClick={() => startEditing(post)}
                        >
                          Edit
                        </button>
                        <button
                          className="social-text-button social-text-button--danger"
                          type="button"
                          onClick={() => handleDelete(post.id)}
                        >
                          {isAdmin ? 'Remove post' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <nav className="social-pagination" aria-label="Feed pages">
                <button
                  className="social-button social-button--secondary"
                  type="button"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {Math.max(feed.totalPages || 1, 1)}
                </span>
                <button
                  className="social-button social-button--secondary"
                  type="button"
                  disabled={page + 1 >= (feed.totalPages || 0) || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          ) : (
            <p className="social-empty">There are no posts yet. Share the first update.</p>
          )}
          </section>
        )}
      </div>
    </main>
  )
}

export default StudentSocialFeed
