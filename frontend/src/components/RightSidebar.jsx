import { useState } from 'react'
import { api } from '../services/api'
import {
  Users,
  TrendingUp,
  Calendar,
  Award,
  ShieldCheck,
  MessageCircle,
  Clock,
} from 'lucide-react'

function SkeletonLine({ className = '', width = '100%' }) {
  return (
    <div
      className={`sidebar-skeleton-line ${className}`}
      style={{ width }}
      aria-hidden="true"
    />
  )
}

function SuggestedStudents({ students, onFollow, following }) {
  if (!students || students.length === 0) {
    return (
      <section className="sidebar-widget">
        <div className="sidebar-widget__header">
          <Users size={18} className="sidebar-widget__icon" aria-hidden="true" />
          <h3 className="sidebar-widget__title">Suggested Students</h3>
        </div>
        <p className="sidebar-empty">No suggestions available right now.</p>
      </section>
    )
  }

  return (
    <section className="sidebar-widget">
      <div className="sidebar-widget__header">
        <Users size={18} className="sidebar-widget__icon" aria-hidden="true" />
        <h3 className="sidebar-widget__title">Suggested Students</h3>
      </div>
      {students.map((student) => {
        const isFollowing = following?.includes(student.id) || false
        const initials = student.fullName
          ? student.fullName.split(/\s+/).map((n) => n[0]).join('')
          : 'U'
        return (
          <div
            key={student.id}
            className="sidebar-suggestion"
          >
            <div className="sidebar-suggestion__avatar">
              {student.profileImageUrl ? (
                <img
                  src={student.profileImageUrl}
                  alt={student.fullName}
                  className="sidebar-suggestion__avatar-img"
                  loading="lazy"
                />
              ) : (
                <span className="sidebar-suggestion__avatar-fallback">{initials}</span>
              )}
            </div>
            <div className="sidebar-suggestion__info">
              <div className="sidebar-suggestion__name">{student.fullName}</div>
              <div className="sidebar-suggestion__subtitle">
                {[student.universityName, student.faculty, student.departmentOrField]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <button
              type="button"
              className={`sidebar-follow-btn ${isFollowing ? 'sidebar-follow-btn--following' : ''}`}
              onClick={() => onFollow(student.id)}
              disabled={isFollowing}
            >
              {isFollowing ? 'Connected' : 'Connect'}
            </button>
          </div>
        )
      })}
    </section>
  )
}

function TrendingTopics({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <section className="sidebar-widget">
        <div className="sidebar-widget__header">
          <TrendingUp size={18} className="sidebar-widget__icon" aria-hidden="true" />
          <h3 className="sidebar-widget__title">Trending Topics</h3>
        </div>
        <p className="sidebar-empty">No trending topics available.</p>
      </section>
    )
  }

  return (
    <section className="sidebar-widget">
      <div className="sidebar-widget__header">
        <TrendingUp size={18} className="sidebar-widget__icon" aria-hidden="true" />
        <h3 className="sidebar-widget__title">Trending Topics</h3>
      </div>
      {categories.map((category, index) => (
        <div
          key={category.code}
          className="sidebar-trending"
        >
          <span className="sidebar-trending__rank">{index + 1}</span>
          <div className="sidebar-trending__content">
            <span className="sidebar-trending__name">{category.displayName}</span>
            <span className="sidebar-trending__posts">{Math.max(50 - index * 10, 20)} posts</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function UpcomingEvents() {
  return (
    <section className="sidebar-widget">
      <div className="sidebar-widget__header">
        <Calendar size={18} className="sidebar-widget__icon" aria-hidden="true" />
        <h3 className="sidebar-widget__title">Upcoming Events</h3>
      </div>
      <div className="sidebar-empty">
        <Clock size={20} className="sidebar-empty__icon" aria-hidden="true" />
        <p>No upcoming events scheduled.</p>
      </div>
    </section>
  )
}

function PopularPosts({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <section className="sidebar-widget">
        <div className="sidebar-widget__header">
          <Award size={18} className="sidebar-widget__icon" aria-hidden="true" />
          <h3 className="sidebar-widget__title">Popular Posts</h3>
        </div>
        <p className="sidebar-empty">No popular posts yet.</p>
      </section>
    )
  }

  const sorted = [...posts]
    .filter((p) => p.likeCount > 0)
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <section className="sidebar-widget">
        <div className="sidebar-widget__header">
          <Award size={18} className="sidebar-widget__icon" aria-hidden="true" />
          <h3 className="sidebar-widget__title">Popular Posts</h3>
        </div>
        <p className="sidebar-empty">No popular posts yet.</p>
      </section>
    )
  }

  return (
    <section className="sidebar-widget">
      <div className="sidebar-widget__header">
        <Award size={18} className="sidebar-widget__icon" aria-hidden="true" />
        <h3 className="sidebar-widget__title">Popular Posts</h3>
      </div>
      {sorted.map((post) => {
        const initials = post.author?.fullName
          ? post.author.fullName.split(/\s+/).map((n) => n[0]).join('')
          : 'U'
        return (
          <div key={post.id} className="sidebar-popular">
            <div className="sidebar-popular__avatar">
              {post.author?.profileImageUrl ? (
                <img
                  src={post.author.profileImageUrl}
                  alt={post.author.fullName}
                  className="sidebar-popular__avatar-img"
                  loading="lazy"
                />
              ) : (
                <span className="sidebar-popular__avatar-fallback">{initials}</span>
              )}
            </div>
            <div className="sidebar-popular__content">
              <div className="sidebar-popular__author">{post.author?.fullName}</div>
              <div className="sidebar-popular__meta">
                <span className="sidebar-popular__likes">
                  {post.likeCount || 0} likes
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function RightSidebar({ categories = [], posts = [], suggestedStudents = [] }) {
  const [following, setFollowing] = useState([])
  const [error, setError] = useState('')

  const handleFollow = async (studentId) => {
    try {
      await api.post(`/api/students/${studentId}/follow`)
      setFollowing((prev) => [...prev, studentId])
    } catch {
      // Follow may already exist; ignore silently
    }
  }

  return (
    <aside className="sidebar-sidebar--right">
      {error && (
        <div className="sidebar-error">{error}</div>
      )}
      <SuggestedStudents
        students={suggestedStudents}
        onFollow={handleFollow}
        following={following}
      />
      <TrendingTopics categories={categories} />
      <UpcomingEvents />
      <PopularPosts posts={posts} />
    </aside>
  )
}
