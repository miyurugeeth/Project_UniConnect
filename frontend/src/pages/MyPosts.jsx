import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import { RefreshCw } from 'lucide-react'
import './SocialNetworking.css'

const PAGE_SIZE = 10

function MyPosts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState({ content: [], number: 0, totalPages: 0 })
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')
  const [busyLikeIds, setBusyLikeIds] = useState(() => new Set())
  const [openCommentPostIds, setOpenCommentPostIds] = useState(() => new Set())
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [commentErrors, setCommentErrors] = useState({})
  const [loadingCommentsFor, setLoadingCommentsFor] = useState(() => new Set())
  const [savingCommentsFor, setSavingCommentsFor] = useState(() => new Set())
  const [editingComment, setEditingComment] = useState(null)

  const pollIntervalRef = useRef(null)
  const isTabVisibleRef = useRef(true)


  useEffect(() => {
    const controller = new AbortController()

    async function loadMyPosts() {
      setIsLoading(true)
      setPostsError('')
      try {
        const response = await api.get('/api/students/feed', {
          params: { page, size: PAGE_SIZE },
          signal: controller.signal,
        })
        const allPosts = response.data.content || []
        const myPosts = allPosts.filter(
          (post) => post.author.id === user.userId,
        )
        setPosts((current) => ({
          ...response.data,
          content: page === 0 ? myPosts : [...current.content, ...myPosts],
          totalPages: response.data.totalPages,
        }))
      } catch (error) {
        if (!controller.signal.aborted) {
          setPostsError(
            error.response?.status === 401
              ? 'Your session expired. Please sign in again.'
              : 'We could not load your posts. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadMyPosts()
    return () => controller.abort()
  }, [page, user.userId])

  useEffect(() => {
    function handleVisibilityChange() {
      isTabVisibleRef.current = document.visibilityState === 'visible'
      if (isTabVisibleRef.current) {
        setPage((current) => current + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    pollIntervalRef.current = setInterval(() => {
      if (isTabVisibleRef.current) {
        setPage((current) => current + 1)
      }
    }, 45000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  function updatePost(postId, update) {
    setPosts((current) => ({
      ...current,
      content: current.content.map((post) =>
        post.id === postId ? { ...post, ...update } : post,
      ),
    }))
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
      updatePost(post.id, {
        likedByCurrentUser: wasLiked,
        likeCount: oldLikeCount,
      })
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
        params: { page: requestedPage, size: PAGE_SIZE },
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
      await api.post(`/api/students/posts/${postId}/comments`, {
        content: commentContent,
      })
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
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
      await api.delete(`/api/students/posts/${postId}/comments/${commentId}`)
      const currentCount = Number(
        posts.content.find((post) => post.id === postId)?.commentCount || 0,
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

  return (
    <main className="social-page">
      <header className="social-header">
        <Link className="social-brand" to="/student/feed">
          Uni<span>Connect</span>
        </Link>
      </header>

      <div className="social-layout__body">
        <section className="social-center">
          <div className="social-center__intro social-intro">
            <p className="social-eyebrow">MY POSTS</p>
            <h1>Your posts</h1>
            <p>All the updates you have shared with the community.</p>
          </div>

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
          ) : postsError ? (
            <div className="social-card" role="alert">
              <p className="social-message social-message--error">{postsError}</p>
              <button
                className="social-button"
                type="button"
                onClick={() => setPage(0)}
              >
                Try again
              </button>
            </div>
          ) : posts.content?.length ? (
            <>
              <div className="social-post-list">
                {posts.content.map((post) => (
                  <article className="social-card social-post lift" key={post.id}>
                    <div className="social-post__author">
                      <Link to={`/student/profiles/${post.author.id}`}>
                        {post.author.fullName}
                      </Link>
                      <span>
                        {[post.author.universityName, post.author.faculty]
                          .filter(Boolean)
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
                                    <Link to={`/student/profiles/${comment.author.id}`}>
                                      {comment.author.fullName}
                                    </Link>
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
                                  {comment.author.id === user?.userId &&
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
                                        Delete
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
                  </article>
                ))}
              </div>
              <nav className="social-pagination" aria-label="My posts pages">
                <button
                  className="social-button social-button--secondary"
                  type="button"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {Math.max(posts.totalPages || 1, 1)}
                </span>
                <button
                  className="social-button social-button--secondary"
                  type="button"
                  disabled={page + 1 >= (posts.totalPages || 0) || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          ) : (
            <section className="empty-state">
              <div className="empty-state__icon">
                <RefreshCw size={28} aria-hidden="true" />
              </div>
              <h3>You have not posted anything yet.</h3>
              <p>Share your first update on the student feed.</p>
              <Link className="social-button" to="/student/feed">Go to feed</Link>
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

export default MyPosts
