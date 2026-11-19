import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, MessageSquareText, Search, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import ThemeToggle from '../components/ThemeToggle'
import './Messages.css'

const POLL_INTERVAL_MS = 5000

function getInitials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'
  )
}

function roleLabel(role) {
  return role === 'PROFESSIONAL' ? 'Professional' : role === 'ADMIN' ? 'Admin' : 'Student'
}

function sortMessages(messages) {
  return [...messages].sort(
    (first, second) => Date.parse(first.sentAt) - Date.parse(second.sentAt),
  )
}

function mergeMessages(currentMessages, incomingMessages) {
  const messagesById = new Map(
    [...currentMessages, ...incomingMessages].map((message) => [message.id, message]),
  )
  return sortMessages([...messagesById.values()])
}

function Messages() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedContactId = searchParams.get('userId')
  const [conversations, setConversations] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loadedContact, setLoadedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationError, setConversationError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [contactError, setContactError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [sendError, setSendError] = useState('')
  const messagesEndRef = useRef(null)
  const selectedContact =
    loadedContact?.id === selectedContactId
      ? loadedContact
      : conversations.find((conversation) => conversation.contact.id === selectedContactId)
          ?.contact || searchResults.find((contact) => contact.id === selectedContactId) || null

  const refreshConversations = useCallback(async (signal) => {
    const response = await api.get('/api/messages/conversations', { signal })
    setConversations(response.data)
    setConversationError('')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let firstLoad = true

    async function loadConversations() {
      try {
        await refreshConversations(controller.signal)
      } catch {
        if (!controller.signal.aborted) {
          setConversationError('We could not load your conversations. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingConversations(false)
        }
      }
      firstLoad = false
    }

    loadConversations()
    const intervalId = window.setInterval(() => {
      if (!firstLoad) loadConversations()
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [refreshConversations])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      return undefined
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError('')
      try {
        const response = await api.get('/api/messages/users', {
          params: { q: normalizedQuery, page: 0, size: 20 },
          signal: controller.signal,
        })
        setSearchResults(response.data.content)
      } catch {
        if (!controller.signal.aborted) {
          setSearchError('We could not search users. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    if (!selectedContactId) {
      return undefined
    }

    const knownContact =
      conversations.find((conversation) => conversation.contact.id === selectedContactId)
        ?.contact || searchResults.find((contact) => contact.id === selectedContactId)
    if (knownContact) {
      return undefined
    }
    if (loadedContact?.id === selectedContactId) return undefined

    const controller = new AbortController()
    api
      .get(`/api/users/${encodeURIComponent(selectedContactId)}`, {
        signal: controller.signal,
      })
      .then((response) => {
        setLoadedContact({
          id: response.data.id,
          fullName: response.data.fullName,
          profileImageUrl: response.data.profileImageUrl,
          role: response.data.role,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setContactError('This user could not be found.')
        }
      })

    return () => controller.abort()
  }, [selectedContactId, loadedContact?.id, conversations, searchResults])

  useEffect(() => {
    if (!selectedContactId) {
      return undefined
    }

    const controller = new AbortController()
    let initialLoad = true

    async function loadMessages() {
      if (initialLoad) setIsLoadingMessages(true)
      try {
        const response = await api.get(
          `/api/messages/conversations/${encodeURIComponent(selectedContactId)}`,
          {
            params: { page: 0, size: 50 },
            signal: controller.signal,
          },
        )
        if (!controller.signal.aborted) {
          setMessages((current) => mergeMessages(current, response.data.content))
          setMessageError('')
        }
      } catch {
        if (!controller.signal.aborted) {
          setMessageError('We could not load this conversation. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingMessages(false)
        initialLoad = false
      }
    }

    loadMessages()
    const intervalId = window.setInterval(loadMessages, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [selectedContactId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  function selectContact(contact) {
    setLoadedContact(contact)
    setSearchParams({ userId: contact.id })
    setMessages([])
    setMessageError('')
    setContactError('')
    setIsLoadingMessages(true)
    setDraft('')
    setSendError('')
  }

  function clearContact() {
    setSearchParams({})
    setLoadedContact(null)
    setMessages([])
    setMessageError('')
    setContactError('')
    setIsLoadingMessages(false)
    setDraft('')
    setSendError('')
  }

  async function sendMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selectedContactId || isSending) return

    setIsSending(true)
    setSendError('')
    try {
      const response = await api.post(
        `/api/messages/conversations/${encodeURIComponent(selectedContactId)}`,
        { content },
      )
      setMessages((current) => mergeMessages(current, [response.data]))
      setDraft('')
      try {
        await refreshConversations()
      } catch {
        setConversationError('Your message was sent, but conversations could not refresh.')
      }
    } catch (error) {
      setSendError(
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'We could not send your message. Please try again.',
      )
    } finally {
      setIsSending(false)
    }
  }

  function updateSearchQuery(value) {
    setQuery(value)
    if (value.trim().length < 2) {
      setSearchResults([])
      setSearchError('')
      setIsSearching(false)
    } else {
      setSearchResults([])
      setSearchError('')
    }
  }

  const dashboardPath =
    user?.role === 'PROFESSIONAL'
      ? '/professional/dashboard'
      : user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/student/dashboard'

  return (
    <main className="messages-page">
      <header className="messages-header">
        <Link className="messages-brand" to={dashboardPath}>
          <span className="messages-brand__icon">
            <MessageSquareText size={19} aria-hidden="true" />
          </span>
          Uni<span>Connect</span>
        </Link>
        <Link className="messages-back-link" to={dashboardPath}>
          <ArrowLeft size={15} aria-hidden="true" />
          Dashboard
        </Link>
        <ThemeToggle />
      </header>

      <section className="messages-layout" aria-label="Messages">
        <aside className="messages-sidebar">
          <div className="messages-sidebar__heading">
            <div>
              <p className="messages-eyebrow">YOUR NETWORK</p>
              <h1>Messages</h1>
            </div>
          </div>

          <label className="messages-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => updateSearchQuery(event.target.value)}
              placeholder="Find someone to message"
              aria-label="Search users"
            />
          </label>

          {searchError && (
            <p className="messages-feedback messages-feedback--error" role="alert">
              {searchError}
            </p>
          )}
          {query.trim().length >= 2 && (
            <section className="messages-list" aria-label="Search results">
              <h2>People</h2>
              {isSearching ? (
                <p className="messages-empty">Searching…</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((contact) => (
                  <ContactButton
                    contact={contact}
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    selected={contact.id === selectedContactId}
                  />
                ))
              ) : (
                !searchError && <p className="messages-empty">No matching users found.</p>
              )}
            </section>
          )}

          <section className="messages-list" aria-label="Your conversations">
            <h2>Recent conversations</h2>
            {conversationError && (
              <p className="messages-feedback messages-feedback--error" role="alert">
                {conversationError}
              </p>
            )}
            {isLoadingConversations ? (
              <p className="messages-empty">Loading conversations…</p>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => (
                <ContactButton
                  contact={conversation.contact}
                  key={conversation.contact.id}
                  lastMessage={conversation.lastMessage}
                  onClick={() => selectContact(conversation.contact)}
                  selected={conversation.contact.id === selectedContactId}
                />
              ))
            ) : (
              !conversationError && (
                <p className="messages-empty">
                  No conversations yet. Search for someone to say hello.
                </p>
              )
            )}
          </section>
        </aside>

        <section className="messages-chat" aria-label="Chat">
          {selectedContactId && selectedContact ? (
            <>
              <header className="messages-chat__header">
                <button
                  className="messages-chat__mobile-back"
                  type="button"
                  onClick={clearContact}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <ContactAvatar contact={selectedContact} />
                <div className="messages-chat__person">
                  <h2>{selectedContact.fullName}</h2>
                  <p>{roleLabel(selectedContact.role)}</p>
                </div>
              </header>

              {messageError && (
                <p className="messages-feedback messages-feedback--error" role="alert">
                  {messageError}
                </p>
              )}
              {contactError && (
                <p className="messages-feedback messages-feedback--error" role="alert">
                  {contactError}
                </p>
              )}

              <div className="messages-thread" aria-live="polite">
                {isLoadingMessages && messages.length === 0 ? (
                  <p className="messages-empty">Loading messages…</p>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.userId
                    return (
                      <div
                        className={`messages-bubble-row${isOwnMessage ? ' messages-bubble-row--own' : ''}`}
                        key={message.id}
                      >
                        <article
                          className={`messages-bubble${isOwnMessage ? ' messages-bubble--own' : ''}`}
                          aria-label={isOwnMessage ? 'Your message' : `${selectedContact.fullName}'s message`}
                        >
                          <p>{message.content}</p>
                          <time dateTime={message.sentAt}>
                            {new Date(message.sentAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </time>
                        </article>
                      </div>
                    )
                  })
                ) : (
                  <p className="messages-empty">No messages yet. Send a message to start chatting.</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="messages-composer" onSubmit={sendMessage}>
                <label className="messages-sr-only" htmlFor="message-draft">
                  Write a message
                </label>
                <textarea
                  id="message-draft"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message…"
                  maxLength={2000}
                  rows={2}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  aria-label="Send message"
                >
                  <Send size={17} aria-hidden="true" />
                  <span>{isSending ? 'Sending…' : 'Send'}</span>
                </button>
                {sendError && (
                  <p className="messages-feedback messages-feedback--error" role="alert">
                    {sendError}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="messages-chat-empty">
              <span>
                <MessageSquareText size={25} aria-hidden="true" />
              </span>
              <h2>{contactError ? 'Conversation unavailable' : 'Your chat box'}</h2>
              <p>
                {contactError ||
                  'Choose a conversation or search for someone to start a private chat.'}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function ContactButton({ contact, lastMessage, onClick, selected }) {
  return (
    <button
      className={`messages-contact${selected ? ' messages-contact--selected' : ''}`}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
    >
      <ContactAvatar contact={contact} />
      <span className="messages-contact__details">
        <span className="messages-contact__name">{contact.fullName}</span>
        <span className="messages-contact__subtitle">
          {lastMessage || roleLabel(contact.role)}
        </span>
      </span>
    </button>
  )
}

function ContactAvatar({ contact }) {
  const [failedImageUrl, setFailedImageUrl] = useState('')

  return contact.profileImageUrl && failedImageUrl !== contact.profileImageUrl ? (
    <img
      className="messages-avatar"
      src={contact.profileImageUrl}
      alt=""
      onError={() => setFailedImageUrl(contact.profileImageUrl)}
    />
  ) : (
    <span className="messages-avatar messages-avatar--initials" aria-hidden="true">
      {getInitials(contact.fullName)}
    </span>
  )
}

export default Messages
