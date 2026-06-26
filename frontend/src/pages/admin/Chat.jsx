import { useState, useEffect, useRef, useCallback } from 'react'
import { adminAxios as axios } from '@/contexts/AdminAuthContext'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, MessageSquare, Loader2, User } from 'lucide-react'

function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?'
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '')
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminChat() {
  const { admin } = useAdminAuth()
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchConversations() {
      try {
        setLoadingConversations(true)
        const { data } = await axios.get('/api/admin/chat/conversations')
        if (!cancelled) setConversations(data.conversations || data.data || [])
      } catch {
        if (!cancelled) setConversations([])
      } finally {
        if (!cancelled) setLoadingConversations(false)
      }
    }
    fetchConversations()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedUser) {
      setMessages([])
      return
    }
    let cancelled = false
    async function fetchMessages() {
      try {
        setLoadingMessages(true)
        const { data } = await axios.get(`/api/admin/chat/messages/${selectedUser._id || selectedUser.id}`)
        if (!cancelled) {
          setMessages(data.messages || data.data || [])
        }
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    }
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [selectedUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function handleSend(e) {
    e.preventDefault()
    if (!messageText.trim() || !selectedUser || sending) return
    try {
      setSending(true)
      const { data } = await axios.post('/api/admin/chat/messages', {
        receiverId: selectedUser._id || selectedUser.id,
        message: messageText.trim(),
      })
      setMessages((prev) => [...prev, data.message || data])
      setMessageText('')
    } catch {
      // error silently
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-72 shrink-0 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
        <div className="p-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Conversations</h2>
        </div>
        {loadingConversations ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-5 text-zinc-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 p-4">
            <MessageSquare className="size-6 text-zinc-600" />
            <p className="text-xs text-zinc-500 text-center">No conversations yet</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-0.5 p-1">
              {conversations.map((conv) => {
                const isSelected =
                  selectedUser &&
                  (selectedUser._id || selectedUser.id) === (conv._id || conv.id)
                const unread = conv.unreadCount || conv.unread || 0
                return (
                  <button
                    key={conv._id || conv.id}
                    onClick={() => setSelectedUser(conv)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-zinc-700/60'
                        : 'hover:bg-zinc-800/60'
                    }`}
                  >
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(conv.firstName, conv.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {conv.firstName} {conv.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <Badge className="size-5 p-0 flex items-center justify-center text-[10px]">
                        {unread > 99 ? '99+' : unread}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="flex-1 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <MessageSquare className="size-10 text-zinc-600" />
            <p className="text-sm text-zinc-500">Select a conversation to start chatting</p>
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-5 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-xs text-zinc-500">{selectedUser.email}</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No messages yet</p>
                )}
                {messages.map((msg, idx) => {
                  const isMine =
                    (msg.senderId || msg.sender) === (admin?._id || admin?.id)
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isMine
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message || msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? 'text-emerald-200' : 'text-zinc-500'
                          }`}
                        >
                          {formatTime(msg.createdAt || msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSend}
              className="p-3 border-t border-zinc-800 flex items-center gap-2"
            >
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!messageText.trim() || sending}>
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
