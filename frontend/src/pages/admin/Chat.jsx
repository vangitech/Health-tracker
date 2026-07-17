import { useState, useEffect, useRef, useCallback } from 'react';
import { adminAxios as axios } from '@/contexts/AdminAuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, MessageSquare, Loader2, Users, Stethoscope, ClipboardList, Heart, ShieldCheck } from 'lucide-react';

function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?';
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLastSeen(dateStr) {
  if (!dateStr) return 'Offline';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'Online';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const roleIcons = {
  doctor: Stethoscope,
  recordofficer: ClipboardList,
  nurse: Heart,
  superadmin: ShieldCheck,
  admin: Users,
};

function getRoleIcon(role) {
  return roleIcons[role] || Users;
}

const roleColors = {
  doctor: 'text-sky-400',
  recordofficer: 'text-violet-400',
  nurse: 'text-pink-400',
  superadmin: 'text-amber-400',
  admin: 'text-zinc-400',
};

function getRoleColor(role) {
  return roleColors[role] || 'text-zinc-400';
}

function getRoleLabel(role) {
  switch (role) {
    case 'doctor':
      return 'Doctor';
    case 'recordofficer':
      return 'Record Officer';
    case 'nurse':
      return 'Nurse';
    case 'superadmin':
      return 'Super Admin';
    default:
      return 'Admin';
  }
}

export default function AdminChat() {
  const { admin } = useAdminAuth();
  const [conversations, setConversations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatTab, setChatTab] = useState('conversations');
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Ping server to update lastLogin (online status)
  useEffect(() => {
    const ping = () => axios.put('/chat/ping').catch(() => {});
    ping();
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchConversations() {
      try {
        setLoadingConversations(true);
        const { data } = await axios.get('/chat/conversations');
        if (!cancelled) setConversations(Array.isArray(data) ? data : data.conversations || data.data || []);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }
    fetchConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchStaff() {
      try {
        setLoadingStaff(true);
        const { data } = await axios.get('/chat/staff');
        if (!cancelled) setStaffList(Array.isArray(data) ? data : data.staff || data.data || []);
      } catch {
        if (!cancelled) setStaffList([]);
      } finally {
        if (!cancelled) setLoadingStaff(false);
      }
    }
    fetchStaff();
    const interval = setInterval(fetchStaff, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    async function fetchMessages() {
      try {
        setLoadingMessages(true);
        const { data } = await axios.get(`/chat/messages/${selectedUser._id || selectedUser.id}`);
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : data.messages || data.data || []);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    fetchMessages();
    const interval = setInterval(() => {
      axios
        .get(`/chat/messages/${selectedUser._id || selectedUser.id}`)
        .then(({ data }) => {
          const msgs = Array.isArray(data) ? data : data.messages || data.data || [];
          setMessages(msgs);
        })
        .catch(() => {});
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || sending) return;
    try {
      setSending(true);
      const { data } = await axios.post('/chat/messages', {
        receiverId: selectedUser._id || selectedUser.id,
        message: messageText.trim(),
      });
      setMessages((prev) => [...prev, data.message || data]);
      setMessageText('');
    } catch {
    } finally {
      setSending(false);
    }
  }

  function isMsgMine(msg) {
    const senderId = msg.senderId || msg.sender;
    if (typeof senderId === 'object') {
      return (senderId._id || senderId.id) === (admin?._id || admin?.id);
    }
    return senderId === (admin?._id || admin?.id);
  }

  function selectUser(user) {
    setSelectedUser(user);
    // Move to conversations tab on mobile
    setChatTab('conversations');
  }

  function renderUserBadge(role) {
    const RoleIcon = getRoleIcon(role);
    return (
      <div className={`flex items-center gap-1 text-[10px] ${getRoleColor(role)}`}>
        <RoleIcon className="size-3" />
        {getRoleLabel(role)}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
        <Tabs value={chatTab} onValueChange={setChatTab} className="flex flex-col h-full">
          <div className="p-3 border-b border-zinc-800">
            <TabsList className="w-full">
              <TabsTrigger value="conversations" className="flex-1 text-xs">
                <MessageSquare className="size-3.5 mr-1" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex-1 text-xs">
                <Users className="size-3.5 mr-1" />
                Staff
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conversations" className="flex-1 flex flex-col m-0 p-0 data-[state=active]:flex">
            {loadingConversations ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="size-5 text-zinc-400 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 p-4">
                <MessageSquare className="size-6 text-zinc-600" />
                <p className="text-xs text-zinc-500 text-center">No conversations yet</p>
                <p className="text-[10px] text-zinc-600 text-center">Go to Staff tab to start a chat</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-0.5 p-1">
                  {conversations.map((conv) => {
                    const uid = conv._id || conv.id;
                    const sid = selectedUser?._id || selectedUser?.id;
                    const isSelected = sid && sid === uid;
                    const unread = conv.unreadCount || conv.unread || 0;
                    return (
                      <button
                        key={uid}
                        onClick={() => selectUser(conv)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-zinc-700/60' : 'hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(conv.firstName, conv.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {conv.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-zinc-100 truncate">
                              {conv.firstName} {conv.lastName}
                            </p>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                        </div>
                        {unread > 0 && (
                          <Badge className="size-5 p-0 flex items-center justify-center text-[10px] shrink-0">
                            {unread > 99 ? '99+' : unread}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="staff" className="flex-1 flex flex-col m-0 p-0 data-[state=active]:flex">
            {loadingStaff ? (
              <div className="flex items-center justify-center flex-1">
                <Loader2 className="size-5 text-zinc-400 animate-spin" />
              </div>
            ) : staffList.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 p-4">
                <Users className="size-6 text-zinc-600" />
                <p className="text-xs text-zinc-500 text-center">No other staff members</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-0.5 p-1">
                  {staffList.map((member) => {
                    const uid = member._id || member.id;
                    const sid = selectedUser?._id || selectedUser?.id;
                    const isSelected = sid && sid === uid;
                    const RoleIcon = getRoleIcon(member.role);
                    return (
                      <button
                        key={uid}
                        onClick={() => selectUser(member)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-zinc-700/60' : 'hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-8">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="size-full object-cover" />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {getInitials(member.firstName, member.lastName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {member.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-lg shadow-emerald-500/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-zinc-100 truncate">
                              {member.firstName} {member.lastName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <RoleIcon className={`size-3 ${getRoleColor(member.role)}`} />
                            <span className={`text-[10px] ${getRoleColor(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </span>
                            <span className="text-[10px] text-zinc-600">·</span>
                            <span className={`text-[10px] ${member.isOnline ? 'text-emerald-400' : 'text-zinc-600'}`}>
                              {member.isOnline ? 'Online' : formatLastSeen(member.lastLogin)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <MessageSquare className="size-10 text-zinc-600" />
            <p className="text-sm text-zinc-500">Select a conversation or staff member to chat</p>
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-5 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-9">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="size-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedUser.firstName, selectedUser.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {selectedUser.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <div className="flex items-center gap-1.5">
                  {renderUserBadge(selectedUser.role)}
                  <span className="text-zinc-600">·</span>
                  <span className={`text-[10px] ${selectedUser.isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {selectedUser.isOnline ? 'Online' : formatLastSeen(selectedUser.lastLogin)}
                  </span>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No messages yet. Say hello!</p>
                )}
                {messages.map((msg, idx) => {
                  const isMine = isMsgMine(msg);
                  const sender = msg.senderId;
                  const senderName =
                    typeof sender === 'object' ? `${sender.firstName || ''} ${sender.lastName || ''}` : '';
                  return (
                    <div key={msg._id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && senderName.trim() && (
                        <span className="text-[10px] text-zinc-600 mb-0.5 px-1">{senderName}</span>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isMine ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message || msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-emerald-200' : 'text-zinc-500'}`}>
                          {formatTime(msg.createdAt || msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex items-center gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!messageText.trim() || sending}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
