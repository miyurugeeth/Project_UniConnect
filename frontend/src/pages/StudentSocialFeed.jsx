import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/useAuth'
import ThemeToggle from '../components/ThemeToggle'
import RightSidebar from '../components/RightSidebar'
import { Clipboard, UserRound } from 'lucide-react'
import './SocialNetworking.css'

const PAGE_SIZE = 10
const COMMENT_PAGE_SIZE = 10
const MAX_ATTACHMENTS = 5
const MAX_VIDEOS = 1
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])
const ACCEPTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])

const FEED_CATEGORIES = [
  { code: '', label: 'All' },
  { code: 'ACADEMIC', label: 'Academic' },
  { code: 'TECHNOLOGY', label: 'Technology' },
  { code: 'EVENTS', label: 'Events' },
  { code: 'GENERAL_UNIVERSITY_LIFE', label: 'General' },
]

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
  const navigate = useNavigate()
  const [feed, setFeed] = useState({ content: [], number: 0, totalPages: 0 })
  const suggestedStudents = feed.content
    .map((post) => post.author)
    .filter(
      (author, index, self) =>
        author && author.id !== user?.userId && self.findIndex((a) => a?.id === author.id) === index
    )
    .slice(0, 5)
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
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

  const [toasts, setToasts] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const pollIntervalRef = useRef(null)
  const isTabVisibleRef = useRef(true)

  useEffect(() => {
    const controller = new AbortController()
    async function loadCategories() {
      setIsLoadingCategories(true)
      setCategoriesError('')
      try {
        const response = await api.get('/api/students/categories', { signal: controller.signal })
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
              : 'We could not load the student feed. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    loadFeed()
    return () => controller.abort()
  }, [page, reloadKey, feedCategoryCode])

  useEffect(() => {
    if (!editScrollRequest || !editingPostId) return
    postComposerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    postContentInputRef.current?.focus({ preventScroll: true })
  }, [editScrollRequest, editingPostId])

  useEffect(
    () => () => {
      selectedAttachmentUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    if (!document.hidden) isTabVisibleRef.current = true
    const handleVisibilityChange = () => { isTabVisibleRef.current = !document.hidden }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      if (isTabVisibleRef.current) setReloadKey((prev) => prev + 1)
    }, 30000)
    return () => clearInterval(pollIntervalRef.current)
  }, [])

  function showToast(message, type = 'info') {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 5000)
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffSeconds = Math.floor((now - date) / 1000)
    if (diffSeconds < 60) return 'Just now'
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
    return `${Math.floor(diffSeconds / 86400)}d ago`
  }

  function getCategoryLabel(code) {
    const category = categories.find((c) => c.code === code)
    return category ? category.displayName : code ? code.replace(/_/g, ' ') : 'General'
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files || [])
    const images = files.filter((f) => ACCEPTED_IMAGE_TYPES.has(f.type))
    const videos = files.filter((f) => ACCEPTED_VIDEO_TYPES.has(f.type))
    if (images.length + videos.length > MAX_ATTACHMENTS) {
      setAttachmentMessage(`You can attach up to ${MAX_ATTACHMENTS} files.`)
      return
    }
    if (videos.length > MAX_VIDEOS) {
      setAttachmentMessage(`You can attach up to ${MAX_VIDEOS} video.`)
      return
    }
    const oversizedImage = images.find((f) => f.size > MAX_IMAGE_BYTES)
    const oversizedVideo = videos.find((f) => f.size > MAX_VIDEO_BYTES)
    if (oversizedImage) {
      setAttachmentMessage('Images must be under 10 MB.')
      return
    }
    if (oversizedVideo) {
      setAttachmentMessage('Videos must be under 100 MB.')
      return
    }
    setAttachmentMessage('')
    const newAttachments = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    newAttachments.forEach((a) => selectedAttachmentUrls.current.add(a.previewUrl))
    setSelectedAttachments((current) => [...current, ...newAttachments])
    event.target.value = ''
  }

  function removeSelectedAttachment(previewUrl) {
    setSelectedAttachments((current) => {
      const removed = current.find((a) => a.previewUrl === previewUrl)
      if (removed) {
        selectedAttachmentUrls.current.delete(removed.previewUrl)
        URL.revokeObjectURL(removed.previewUrl)
      }
      return current.filter((a) => a.previewUrl !== previewUrl)
    })
  }

  function removeRetainedAttachment(attachmentId) {
    setRetainedAttachments((current) => current.filter((a) => a.id !== attachmentId))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!content.trim() && selectedAttachments.length === 0 && retainedAttachments.length === 0) {
      setPostMessage('Please add some content or attachments before publishing.')
      setPostMessageIsError(true)
      setTimeout(() => setPostMessage(''), 4000)
      return
    }
    setIsSaving(true)
    setPostMessage('')
    const request = {
      content,
      imageUrl,
      categoryCode: postCategoryCode || 'GENERAL_UNIVERSITY_LIFE',
    }
    const formData = new FormData()
    formData.append(
      'post',
      new Blob([JSON.stringify(request)], { type: 'application/json' }),
      'post.json',
    )
    selectedAttachments.forEach(({ file }) => formData.append('attachments', file))
    const queryParams = new URLSearchParams()
    retainedAttachments.forEach((attachment) =>
      queryParams.append('retainedAttachmentIds', attachment.id),
    )
    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''
    try {
      await api.post(`/api/students/posts${suffix}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const p = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(p)
          }
        },
      })
      setReloadKey((prev) => prev + 1)
      setContent('')
      setPostCategoryCode('')
      setSelectedAttachments([])
      setRetainedAttachments([])
      setImageUrl('')
      setUploadProgress(0)
      selectedAttachmentUrls.current.forEach((url) => URL.revokeObjectURL(url))
      selectedAttachmentUrls.current.clear()
      setPostMessage('Post published!')
      setPostMessageIsError(false)
      setTimeout(() => setPostMessage(''), 3000)
    } catch {
      setPostMessage('We could not publish your post. Please try again.')
      setPostMessageIsError(true)
      setTimeout(() => setPostMessage(''), 4000)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePost(event) {
    event.preventDefault()
    if (!content.trim()) return
    setIsSaving(true)
    setPostMessage('')
    const request = {
      content,
      imageUrl,
      categoryCode: postCategoryCode || 'GENERAL_UNIVERSITY_LIFE',
    }
    const formData = new FormData()
    formData.append(
      'post',
      new Blob([JSON.stringify(request)], { type: 'application/json' }),
      'post.json',
    )
    selectedAttachments.forEach(({ file }) => formData.append('attachments', file))
    const queryParams = new URLSearchParams()
    retainedAttachments.forEach((attachment) =>
      queryParams.append('retainedAttachmentIds', attachment.id),
    )
    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''
    try {
      await api.put(`/api/students/posts/${editingPostId}${suffix}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setReloadKey((prev) => prev + 1)
      cancelEditing()
      setPostMessage('Post updated!')
      setPostMessageIsError(false)
      setTimeout(() => setPostMessage(''), 3000)
    } catch {
      setPostMessage('We could not update your post. Please try again.')
      setPostMessageIsError(true)
      setTimeout(() => setPostMessage(''), 4000)
    } finally {
      setIsSaving(false)
    }
  }

  function cancelEditing() {
    setEditingPostId(null)
    setContent('')
    setPostCategoryCode('')
    setSelectedAttachments([])
    setRetainedAttachments([])
    setImageUrl('')
    setUploadProgress(0)
    selectedAttachmentUrls.current.forEach((url) => URL.revokeObjectURL(url))
    selectedAttachmentUrls.current.clear()
    setEditScrollRequest(0)
  }

  async function deletePost(postId) {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await api.delete(`/api/students/posts/${postId}`)
      setReloadKey((prev) => prev + 1)
      setFeed((current) => {
        const nextContent = current.content.filter((p) => p.id !== postId)
        // If current page is now empty and not on page 0, go to previous page
        if (nextContent.length === 0 && page > 0) {
          setPage((prev) => prev - 1)
        }
        return { ...current, content: nextContent }
      })
      cancelEditing()
    } catch {
      setPostMessage('We could not delete your post. Please try again.')
      setPostMessageIsError(true)
      setTimeout(() => setPostMessage(''), 4000)
    }
  }

  function startEditingPost(post) {
    setEditingPostId(post.id)
    setContent(post.content || '')
    setPostCategoryCode(post.category?.code || '')
    setRetainedAttachments(post.attachments || [])
    setEditScrollRequest(Date.now())
  }

  async function handleLike(post) {
    if (busyLikeIds.has(post.id)) return
    const wasLiked = post.likedByCurrentUser
    const oldLikeCount = post.likeCount || 0
    updatePost(post.id, {
      likedByCurrentUser: !wasLiked,
      likeCount: wasLiked ? Math.max(0, oldLikeCount - 1) : oldLikeCount + 1,
    })
    setBusyLikeIds((current) => new Set(current).add(post.id))
    try {
      const response = wasLiked
        ? await api.delete(`/api/students/posts/${post.id}/likes`)
        : await api.post(`/api/students/posts/${post.id}/likes`)
      updatePost(post.id, response.data)
    } catch {
      updatePost(post.id, { likedByCurrentUser: wasLiked, likeCount: oldLikeCount })
      showToast('We could not update your like. Please try again.', 'error')
    } finally {
      setBusyLikeIds((current) => { const next = new Set(current); next.delete(post.id); return next })
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
          content: requestedPage === 0
            ? response.data.content
            : [...(current[postId]?.content || []), ...response.data.content],
        },
      }))
    } catch {
      setCommentErrors((current) => ({ ...current, [postId]: 'We could not load comments. Please try again.' }))
    } finally {
      setLoadingCommentsFor((current) => { const next = new Set(current); next.delete(postId); return next })
    }
  }

  function toggleComments(postId) {
    if (openCommentPostIds.has(postId)) {
      setOpenCommentPostIds((current) => { const next = new Set(current); next.delete(postId); return next })
      return
    }
    setOpenCommentPostIds((current) => new Set(current).add(postId))
    if (!commentsByPost[postId]) loadComments(postId)
  }

  async function submitComment(postId, event) {
    event.preventDefault()
    const commentContent = (commentDrafts[postId] || '').trim()
    if (!commentContent || savingCommentsFor.has(postId)) return
    const optimisticComment = {
      id: `opt-${Date.now()}`,
      content: commentContent,
      author: user,
      createdAt: new Date().toISOString(),
    }
    setCommentsByPost((current) => ({
      ...current,
      [postId]: { ...current[postId], content: [...(current[postId]?.content || []), optimisticComment] },
    }))
    const currentCount = Number(feed.content.find((post) => post.id === postId)?.commentCount || 0)
    updatePost(postId, { commentCount: currentCount + 1 })
    setSavingCommentsFor((current) => new Set(current).add(postId))
    setCommentErrors((current) => ({ ...current, [postId]: '' }))
    try {
      await api.post(`/api/students/posts/${postId}/comments`, { content: commentContent })
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
      await loadComments(postId)
    } catch {
      setCommentsByPost((current) => ({
        ...current,
        [postId]: { ...current[postId], content: (current[postId]?.content || []).filter((c) => c.id !== optimisticComment.id) },
      }))
      updatePost(postId, { commentCount: currentCount })
      setCommentErrors((current) => ({ ...current, [postId]: 'We could not add your comment. Please try again.' }))
    } finally {
      setSavingCommentsFor((current) => { const next = new Set(current); next.delete(postId); return next })
    }
  }

  async function saveComment(postId, commentId, commentContent) {
    if (!commentContent.trim()) return
    setSavingCommentsFor((current) => new Set(current).add(postId))
    try {
      await api.put(`/api/students/posts/${postId}/comments/${commentId}`, { content: commentContent.trim() })
      setEditingComment(null)
      await loadComments(postId)
    } catch {
      setCommentErrors((current) => ({ ...current, [postId]: 'We could not update your comment. Please try again.' }))
    } finally {
      setSavingCommentsFor((current) => { const next = new Set(current); next.delete(postId); return next })
    }
  }

  async function deleteComment(postId, commentId) {
    setSavingCommentsFor((current) => new Set(current).add(postId))
    try {
      await api.delete(`/api/students/posts/${postId}/comments/${commentId}`)
      const currentCount = Number(feed.content.find((post) => post.id === postId)?.commentCount || 0)
      updatePost(postId, { commentCount: Math.max(0, currentCount - 1) })
      await loadComments(postId)
    } catch {
      setCommentErrors((current) => ({ ...current, [postId]: 'We could not delete your comment. Please try again.' }))
    } finally {
      setSavingCommentsFor((current) => { const next = new Set(current); next.delete(postId); return next })
    }
  }

  function updatePost(postId, update) {
    setFeed((current) => ({
      ...current,
      content: current.content.map((post) => post.id === postId ? { ...post, ...update } : post),
    }))
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
      const response = await api.get('/api/students/search', { params: { q: searchTerm, page: 0, size: PAGE_SIZE } })
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

  const submitDisabled = !content.trim() && selectedAttachments.length === 0 && retainedAttachments.length === 0
  const initials = user?.fullName ? user.fullName.split(/\s+/).map((n) => n[0]).join('') : 'U'

  return (
    <div className="social-page" aria-label="Student Feed">
      <header className="social-header">
        <div className="social-brand">
          Uni<span>Connect</span>
        </div>
        <div className="social-header__actions">
          <ThemeToggle />
        </div>
      </header>

      <div className="feed-dashboard">
        <main className="feed-center">
          <header className="feed-header">
            <div className="feed-welcome">
              <div className="feed-eyebrow">UniConnect &bull; Student Feed</div>
              <h1 className="feed-title">Welcome back, {user?.fullName}</h1>
              <p className="feed-subtitle">Here&rsquo;s what&rsquo;s happening at your university today.</p>
            </div>
          </header>

          <section className="feed-card feed-composer" aria-labelledby="composer-title">
            <h2 id="composer-title">Create a post</h2>
            <form onSubmit={handleSubmit} className="feed-composer__form">
              <div className="feed-composer__header">
                <div className="feed-composer__avatar">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.fullName} className="feed-composer__avatar-img" loading="lazy" />
                  ) : (
                    <span className="feed-composer__avatar-fallback">{initials}</span>
                  )}
                </div>
                <div className="feed-composer__input-wrapper">
                  <label htmlFor="post-content" className="feed-composer__label">
                    Post text
                  </label>
                  <textarea
                    id="post-content"
                    ref={postContentInputRef}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="What&rsquo;s on your mind?"
                    rows={4}
                    className="feed-composer__textarea"
                  />
                  <label htmlFor="post-category" className="feed-composer__label">
                    Post category
                  </label>
                  <div className="feed-composer__category">
                    <select
                      id="post-category"
                      value={postCategoryCode}
                      onChange={(event) => setPostCategoryCode(event.target.value)}
                      className="feed-composer__select"
                    >
                      <option value="GENERAL_UNIVERSITY_LIFE">General</option>
                      {categories.map((category) => (
                        <option key={category.code} value={category.code}>{category.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {imageUrl && (
                <div className="feed-image-preview">
                  <img src={imageUrl} alt="Preview" />
                  <button type="button" className="feed-text-button feed-text-button--danger" onClick={() => setImageUrl('')}>
                    Remove
                  </button>
                </div>
              )}

              <label htmlFor="post-attachments" className="feed-composer__label">Photos or video</label>
              <input type="file" accept=".jpg,.jpeg,.png,.gif,.mp4,.webm" multiple onChange={handleAttachmentChange} className="visually-hidden" id="post-attachments" />
              <button type="button" className="feed-button feed-button--secondary" onClick={() => document.getElementById('post-attachments')?.click()} disabled={isSaving}>
                Attach media
              </button>
              {attachmentMessage && (
                <p className="social-message social-message--error" role="alert">{attachmentMessage}</p>
              )}
              {(retainedAttachments.length > 0 || selectedAttachments.length > 0) && (
                <div className="social-attachment-preview" aria-label="Selected attachments">
                  {retainedAttachments.map((attachment) => (
                    <div className="social-attachment-preview__item" key={attachment.id}>
                      <ProtectedPostMedia attachment={attachment} />
                      <button className="social-text-button social-text-button--danger" type="button" onClick={() => removeRetainedAttachment(attachment.id)}>
                        Remove existing attachment
                      </button>
                    </div>
                  ))}
                  {selectedAttachments.map(({ file, previewUrl }) => (
                    <div className="social-attachment-preview__item" key={previewUrl}>
                      {ACCEPTED_VIDEO_TYPES.has(file.type) ? (
                        <video className="social-post__video" controls src={previewUrl} />
                      ) : (
                        <img className="social-post__image" src={previewUrl} alt="Selected preview" />
                      )}
                      <button className="social-text-button social-text-button--danger" type="button" onClick={() => removeSelectedAttachment(previewUrl)}>
                        Remove selected attachment
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadProgress > 0 && (
                <div className="upload-progress"><div className="upload-progress__bar" style={{ width: `${uploadProgress}%` }} /></div>
              )}
              {postMessage && (
                <p className={`social-message ${postMessageIsError ? 'social-message--error' : 'social-message--success'}`} role={postMessageIsError ? 'alert' : 'status'}>
                  {postMessage}
                </p>
              )}
              <div className="feed-composer__actions">
                {editingPostId && (
                  <button className="feed-button feed-button--secondary" type="button" onClick={cancelEditing} disabled={isSaving}>
                    Cancel edit
                  </button>
                )}
                <button className="feed-button" type="submit" disabled={submitDisabled}>
                  {isSaving ? 'Saving…' : 'Publish post'}
                </button>
              </div>
            </form>
          </section>

          <section className="social-card social-search" aria-labelledby="search-title">
            <h2 id="search-title" className="visually-hidden">Find students</h2>
            <form className="social-search-form" onSubmit={handleSearch}>
              <label htmlFor="student-search" className="visually-hidden">
                Search students
              </label>
              <input
                id="student-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, university, faculty, or department"
              />
              <button className="feed-button" type="submit" disabled={isSearching}>
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
                      to={`/student/profiles/${student.id}`}
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
                  <section className="empty-state">
                    <div className="empty-state__icon">
                      <UserRound size={28} aria-hidden="true" />
                    </div>
                    <h3>No students matched that search.</h3>
                    <p>Try a different name, university, or faculty.</p>
                  </section>
                )}
              </div>
            )}
          </section>

          <label htmlFor="feed-category-filter" className="feed-label">
            Filter by category
          </label>
          <select
            id="feed-category-filter"
            value={feedCategoryCode}
            onChange={(event) => {
              setPage(0)
              setFeedCategoryCode(event.target.value)
            }}
            className="feed-category-select"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.code} value={category.code}>
                {category.displayName}
              </option>
            ))}
          </select>
          <div className="feed-category-tabs">
            {FEED_CATEGORIES.map((cat) => {
              const isActive = feedCategoryCode === cat.code
              return (
                <button key={cat.code} type="button" className={`feed-tab ${isActive ? 'feed-tab--active' : ''}`} onClick={() => { setPage(0); setFeedCategoryCode(cat.code || undefined) }}>
                  {cat.label}
                </button>
              )
            })}
          </div>

          <section className="feed-feed" aria-labelledby="feed-title">
            <h2 id="feed-title" className="visually-hidden">Latest posts</h2>
            {isLoading ? (
              <div className="social-post-list" aria-live="polite">
                {[1, 2, 3].map((i) => (
                  <article className="social-card social-post skeleton" key={`skeleton-${i}`}>
                    <div className="skeleton__avatar" />
                    <div className="skeleton__block skeleton__block--lg" />
                    <div className="skeleton__block skeleton__block--md" />
                    <div className="skeleton__block skeleton__block--sm" />
                    <div className="skeleton__block skeleton__block--lg" />
                    <div className="skeleton__pulse" />
                  </article>
                ))}
              </div>
            ) : feedError ? (
              <div className="feed-card" role="alert">
                <p className="social-message social-message--error">{feedError}</p>
                <button className="feed-button" type="button" onClick={() => setReloadKey((prev) => prev + 1)}>
                  Try again
                </button>
              </div>
            ) : (
              <div className="social-post-list" aria-live="polite">
                {feed.content.map((post) => (
                  <article key={post.id} className={`social-card social-post${post.id === editingPostId ? ' social-post--editing' : ''}`}>
                    <div className="social-post__header">
                      <div className="social-post__author">
                        <div className="social-post__avatar">
                          {post.author?.profileImageUrl ? (
                            <img src={post.author.profileImageUrl} alt={post.author.fullName} className="social-post__avatar-img" loading="lazy" />
                          ) : (
                            <span className="social-post__avatar-fallback">{post.author?.fullName ? post.author.fullName.split(/\s+/).map((n) => n[0]).join('') : 'U'}</span>
                          )}
                        </div>
                        <div className="social-post__author-info">
                          <div className="social-post__author-name">{post.author?.fullName}</div>
                          <div className="social-post__author-meta">{[post.author?.universityName, post.author?.faculty].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                      <div className="social-post__meta">
                        <time className="social-post__time">{formatRelativeTime(post.createdAt)}</time>
                        {post.category && (
                          <span className="social-post__category">{getCategoryLabel(post.category.code)}</span>
                        )}
                        {post.author?.id === user?.userId && (
                          <>
                            <button className="feed-text-button" type="button" onClick={() => startEditingPost(post)}>
                              Edit
                            </button>
                            <button className="feed-text-button feed-text-button--danger" type="button" onClick={() => deletePost(post.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="social-post__content"><p>{post.content}</p></div>

                    {post.attachments && post.attachments.length > 0 && (
                      <div className="social-post__attachments">
                        {post.attachments.map((attachment) => (
                          <ProtectedPostMedia key={attachment.id} attachment={attachment} />
                        ))}
                      </div>
                    )}

                    <div className="social-post__actions">
                      <button className={`social-action-btn ${post.likedByCurrentUser ? 'social-action-btn--active' : ''}`} type="button" aria-label={post.likedByCurrentUser ? `Unlike · ${post.likeCount || 0}` : `Like · ${post.likeCount || 0}`} onClick={() => handleLike(post)} disabled={busyLikeIds.has(post.id)}>
                        <span className="social-action-btn__icon">{post.likedByCurrentUser ? '❤️' : '🤍'}</span>
                        <span className="social-action-btn__label">{post.likedByCurrentUser ? 'Unlike' : 'Like'}</span>
                      </button>
                      <button className="social-action-btn" type="button" aria-label={`Comments · ${post.commentCount || 0}`} onClick={() => toggleComments(post.id)}>
                        <span className="social-action-btn__icon">💬</span>
                        <span className="social-action-btn__label">Comment</span>
                      </button>
                      <button className="social-action-btn" type="button" aria-label="Share">
                        <span className="social-action-btn__icon">📤</span>
                        <span className="social-action-btn__label">Share</span>
                      </button>
                    </div>

                    {openCommentPostIds.has(post.id) && (
                      <div className="social-comments">
                        {commentsByPost[post.id]?.error && (
                          <p className="social-message social-message--error">{commentsByPost[post.id].error}</p>
                        )}
                        <div className="social-comments__list">
                          {(commentsByPost[post.id]?.content || []).map((comment) => {
                            const isEditing = editingComment?.id === comment.id && editingComment?.postId === post.id
                            return (
                              <article key={comment.id} className={`social-comment${comment.author.id === user?.userId ? ' social-comment--owner' : ''}`}>
                                <div className="social-comment__header">
                                  <div className="social-comment__avatar">
                                    {comment.author.profileImageUrl ? (
                                      <img src={comment.author.profileImageUrl} alt={comment.author.fullName} className="social-comment__avatar-img" loading="lazy" />
                                    ) : (
                                      <span className="social-comment__avatar-fallback">{comment.author.fullName ? comment.author.fullName.split(/\s+/).map((n) => n[0]).join('') : 'U'}</span>
                                    )}
                                  </div>
                                  <div className="social-comment__author-info">
                                    <div className="social-comment__author-name">{comment.author.fullName}</div>
                                    <time className="social-comment__time">{formatRelativeTime(comment.createdAt)}</time>
                                  </div>
                                </div>
                                <div className="social-comment__content">
                                  {isEditing ? (
                                    <form className="social-comment__edit-form" onSubmit={(event) => {
                                    event.preventDefault()
                                    const textarea = event.target.elements.namedItem('comment-content')
                                    saveComment(post.id, comment.id, textarea?.value || '')
                                  }}>
<label htmlFor="edit-comment-${comment.id}" className="visually-hidden">Edit comment</label>
<textarea name="comment-content" id="edit-comment-${comment.id}" className="social-comment__edit-textarea" defaultValue={comment.content} />
                                      <div className="social-comment__actions">
                                        <button className="social-text-button" type="submit">Save comment</button>
                                        <button className="social-text-button" type="button" onClick={() => setEditingComment(null)}>Cancel</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <p>{comment.content}</p>
                                  )}
                                  {comment.author.id === user?.userId && editingComment?.id !== comment.id && (
                                    <div className="social-comment__actions">
                                      <button className="social-text-button" type="button" onClick={() => setEditingComment({ id: comment.id, postId: post.id, content: comment.content })}>
                                        Edit
                                      </button>
                                      <button className="social-text-button social-text-button--danger" type="button" disabled={savingCommentsFor.has(post.id)} onClick={() => deleteComment(post.id, comment.id)}>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </article>
                            )
                          })}
                        </div>
                        {commentsByPost[post.id]?.number + 1 < commentsByPost[post.id]?.totalPages && (
                          <button className="feed-button feed-button--secondary" type="button" disabled={loadingCommentsFor.has(post.id)} onClick={() => loadComments(post.id, (commentsByPost[post.id]?.number || 0) + 1)}>
                            {loadingCommentsFor.has(post.id) ? 'Loading…' : 'Load more comments'}
                          </button>
                        )}
                        <form className="social-comment__form" onSubmit={(event) => submitComment(post.id, event)}>
                          <textarea className="social-comment__draft" placeholder="Write a comment…" value={commentDrafts[post.id] || ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} />
                          <button className="feed-button feed-button--secondary" type="submit" disabled={savingCommentsFor.has(post.id)}>
                            Comment
                          </button>
                        </form>
                      </div>
                    )}

                    {editingPostId === post.id && (
                      <section ref={postComposerRef} className="feed-card feed-composer" aria-labelledby={`edit-composer-${post.id}`}>
                        <h2 id={`edit-composer-${post.id}`}>Edit your post</h2>
                        <form onSubmit={handleUpdatePost} className="feed-composer__form">
                          <div className="feed-composer__header">
                            <div className="feed-composer__avatar">
                              {user?.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt={user.fullName} className="feed-composer__avatar-img" loading="lazy" />
                              ) : (
                                <span className="feed-composer__avatar-fallback">{initials}</span>
                              )}
                            </div>
                            <div className="feed-composer__input-wrapper">
                              <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="feed-composer__textarea" />
                              <div className="feed-composer__category">
                                <select value={postCategoryCode} onChange={(event) => setPostCategoryCode(event.target.value)} className="feed-composer__select">
                                  <option value="">Select category</option>
                                  {categories.map((category) => (
                                    <option key={category.code} value={category.code}>{category.displayName}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          {attachmentMessage && (
                            <p className="social-message social-message--error" role="alert">{attachmentMessage}</p>
                          )}
                          {(retainedAttachments.length > 0 || selectedAttachments.length > 0) && (
                            <div className="social-attachment-preview" aria-label="Selected attachments">
                              {retainedAttachments.map((attachment) => (
                                <div className="social-attachment-preview__item" key={attachment.id}>
                                  <ProtectedPostMedia attachment={attachment} />
                                  <button className="social-text-button social-text-button--danger" type="button" onClick={() => removeRetainedAttachment(attachment.id)}>
                                    Remove existing attachment
                                  </button>
                                </div>
                              ))}
                              {selectedAttachments.map(({ file, previewUrl }) => (
                                <div className="social-attachment-preview__item" key={previewUrl}>
                                  {ACCEPTED_VIDEO_TYPES.has(file.type) ? (
                                    <video className="social-post__video" controls src={previewUrl} />
                                  ) : (
                                    <img className="social-post__image" src={previewUrl} alt="Selected preview" />
                                  )}
                                  <button className="social-text-button social-text-button--danger" type="button" onClick={() => removeSelectedAttachment(previewUrl)}>
                                    Remove selected attachment
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {uploadProgress > 0 && (
                            <div className="upload-progress"><div className="upload-progress__bar" style={{ width: `${uploadProgress}%` }} /></div>
                          )}
                          {postMessage && (
                            <p className={`social-message ${postMessageIsError ? 'social-message--error' : 'social-message--success'}`} role={postMessageIsError ? 'alert' : 'status'}>
                              {postMessage}
                            </p>
                          )}
                          <div className="feed-composer__actions">
                            <button className="feed-button feed-button--secondary" type="button" onClick={cancelEditing} disabled={isSaving}>
                              Cancel edit
                            </button>
                            <button className="feed-button" type="submit" disabled={isSaving}>
                              {isSaving ? 'Saving…' : 'Save changes'}
                            </button>
                          </div>
                        </form>
                      </section>
                    )}
                  </article>
                ))}
                {feed.totalPages > 1 && (
                  <div className="feed-pagination">
                    <button className="feed-button feed-button--secondary" type="button" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                      Previous
                    </button>
                    <span className="feed-pagination__page">Page {page + 1} of {feed.totalPages}</span>
                    <button className="feed-button feed-button--secondary" type="button" disabled={page >= feed.totalPages - 1} onClick={() => setPage((prev) => prev + 1)}>
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="feed-sidebar">
          <RightSidebar
          categories={categories}
          posts={feed.content}
          suggestedStudents={suggestedStudents}
        />
        </aside>
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentSocialFeed
