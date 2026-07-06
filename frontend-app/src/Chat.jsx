import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Mic, MicOff, Plus, MessageSquare, Trash2, Sparkles, PanelLeftClose, PanelLeftOpen, Headphones } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import VoiceModeModal from './VoiceModeModal'

export default function Chat({ isAdmin = false, openPricing }) {
  const navigate = useNavigate()
  const role = isAdmin ? 'admin' : 'user'
  const sessionsKey = isAdmin ? 'adminSavedSessions' : 'userSavedSessions'
  const activeKey = isAdmin ? 'adminActiveSessionId' : 'userActiveSessionId'
  
  const generateId = () => `${role}-session-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return generateId()
  })
  
  const [savedSessions, setSavedSessions] = useState(() => {
    const saved = localStorage.getItem(sessionsKey)
    return saved ? JSON.parse(saved) : []
  })

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [hoveredSession, setHoveredSession] = useState(null)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [showVoiceMode, setShowVoiceMode] = useState(false)
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const [usageCount, setUsageCount] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(null)

  useEffect(() => {
    if (!isAdmin) {
      const storedCount = parseInt(localStorage.getItem('userUsageCount') || '0', 10);
      const storedLockout = parseInt(localStorage.getItem('userLockoutUntil') || '0', 10);
      if (storedLockout && Date.now() < storedLockout) {
        setUsageCount(storedCount);
        setLockoutUntil(storedLockout);
      } else if (storedLockout && Date.now() >= storedLockout) {
        localStorage.removeItem('userUsageCount');
        localStorage.removeItem('userLockoutUntil');
        setUsageCount(0);
        setLockoutUntil(null);
      } else {
        setUsageCount(storedCount);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(activeKey, currentSessionId)
    const fetchHistory = async () => {
      const exists = savedSessions.find(s => s.id === currentSessionId)
      if (exists) {
        try {
          setIsLoading(true)
          const res = await axios.get(`https://ai-agent-production-4269.up.railway.app/api/chat/history/${currentSessionId}`)
          if (res.data && res.data.length > 0) {
            const formatted = res.data.flatMap(conv => {
              const msgs = []
              if (conv.userQuestion) msgs.push({ id: `u-${conv.id}`, sender: 'user', text: conv.userQuestion })
              if (conv.aiResponse) msgs.push({ 
                id: `a-${conv.id}`, sender: 'ai', text: conv.aiResponse,
                isEscalated: conv.isEscalated, confidenceScore: conv.confidenceScore,
                answeredFromFaq: conv.answeredFromFaq
              })
              return msgs
            })
            setMessages(formatted)
          } else { setMessages([]) }
        } catch (e) { console.error("Failed to load history", e) }
        finally { setIsLoading(false) }
      } else { setMessages([]) }
    }
    fetchHistory()
  }, [currentSessionId])

  const startNewChat = () => setCurrentSessionId(generateId())
  const loadSession = (id) => setCurrentSessionId(id)

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return
    try {
      await axios.delete(`https://ai-agent-production-4269.up.railway.app/api/chat/sessions/${sessionToDelete}`)
      const newSessions = savedSessions.filter(s => s.id !== sessionToDelete)
      setSavedSessions(newSessions)
      localStorage.setItem(sessionsKey, JSON.stringify(newSessions))
      if (sessionToDelete === currentSessionId) startNewChat()
    } catch (err) { console.error('Error deleting session', err) }
    finally { setSessionToDelete(null) }
  }

  const cancelDeleteSession = () => {
    setSessionToDelete(null)
  }

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      recognitionRef.current = new SR()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'ar-SA'
      recognitionRef.current.onresult = (e) => { setInput(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript) }
      recognitionRef.current.onerror = () => setIsRecording(false)
      recognitionRef.current.onend = () => setIsRecording(false)
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false) }
    else if (recognitionRef.current) { try { recognitionRef.current.start(); setIsRecording(true) } catch(e){} }
    else alert("Your browser does not support voice recording.")
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendQuestion = async (questionText) => {
    if (!questionText.trim()) return
    
    if (!isAdmin) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('userUsageCount', newCount);
      if (newCount >= 10) {
        const lockoutTime = Date.now() + 3 * 60 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('userLockoutUntil', lockoutTime);
      }
    }

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: questionText }])
    setInput('')
    setIsLoading(true)
    try {
      const isArabic = /[\u0600-\u06FF]/.test(questionText)
      if (messages.length === 0) {
        const title = questionText.length > 30 ? questionText.substring(0, 30) + '...' : questionText
        const updated = [{ id: currentSessionId, title }, ...savedSessions]
        setSavedSessions(updated)
        localStorage.setItem(sessionsKey, JSON.stringify(updated))
      }
      const response = await axios.post('https://ai-agent-production-4269.up.railway.app/api/chat/ask', {
        sessionId: currentSessionId, question: questionText,
        language: isArabic ? 'ar' : 'en', role
      })
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, sender: 'ai', text: response.data.answer,
        isEscalated: response.data.escalated, confidenceScore: response.data.confidenceScore,
        answeredFromFaq: response.data.answeredFromFaq, followUps: response.data.suggestedFollowUps || []
      }])
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'عذراً، الخادم غير متصل. الرجاء التأكد من تشغيل الـ Backend.', isEscalated: true }])
    } finally { setIsLoading(false) }
  }

  const handleVoiceMessage = async (questionText) => {
    if (!questionText.trim()) return "";
    
    if (!isAdmin) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('userUsageCount', newCount);
      if (newCount >= 10) {
        const lockoutTime = Date.now() + 3 * 60 * 60 * 1000;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('userLockoutUntil', lockoutTime);
      }
    }

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: questionText }])
    
    try {
      const isArabic = /[\u0600-\u06FF]/.test(questionText)
      if (messages.length === 0) {
        const title = questionText.length > 30 ? questionText.substring(0, 30) + '...' : questionText
        const updated = [{ id: currentSessionId, title }, ...savedSessions]
        setSavedSessions(updated)
        localStorage.setItem(sessionsKey, JSON.stringify(updated))
      }
      const response = await axios.post('https://ai-agent-production-4269.up.railway.app/api/chat/ask', {
        sessionId: currentSessionId, question: questionText,
        language: isArabic ? 'ar' : 'en', role
      })
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, sender: 'ai', text: response.data.answer,
        isEscalated: response.data.escalated, confidenceScore: response.data.confidenceScore,
        answeredFromFaq: response.data.answeredFromFaq, followUps: response.data.suggestedFollowUps || []
      }])
      return response.data.answer;
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'عذراً، الخادم غير متصل. الرجاء التأكد من تشغيل الـ Backend.', isEscalated: true }])
      throw error;
    }
  }

  const showWelcome = messages.length === 0

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginTop: '-1rem', position: 'relative', zIndex: 1 }}>

      
      {/* ===== Sidebar ===== */}
      <div className={`chat-sidebar ${isSidebarOpen ? 'open' : 'closed'}`} style={{ 
        width: isSidebarOpen ? '260px' : '0px', 
        minWidth: isSidebarOpen ? '260px' : '0px', 
        borderRight: isSidebarOpen ? '1px solid var(--border-color)' : 'none', 
        display: 'flex', flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        padding: isSidebarOpen ? '16px 10px 10px 10px' : '0',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
        opacity: isSidebarOpen ? 1 : 0,
        visibility: isSidebarOpen ? 'visible' : 'hidden'
      }}>
        {/* Mobile Close Button (only visible on small screens when sidebar is open) */}
        <div className="mobile-only-close" style={{ display: 'none', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{
            background: 'var(--btn-sec-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)',
            padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex'
          }}>
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <button onClick={startNewChat} style={{
          width: 'calc(100% - 4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
          background: 'var(--btn-sec-bg)',
          color: 'var(--text-color)', border: '1px solid var(--border-color)',
          padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
          fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.25s',
          margin: '0 auto'
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'var(--btn-sec-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'var(--btn-sec-bg)'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <Plus size={15}/> محادثة جديدة
        </button>
        
        {/* Sessions List */}
        <div style={{ marginTop: '1.2rem', flexGrow: 1, overflowY: 'auto', padding: '0 4px' }}>
          <div style={{fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '8px'}}>
            {isAdmin ? 'Admin Chats' : 'My Chats'}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1px'}}>
            {savedSessions.map(s => {
              const isActive = s.id === currentSessionId
              const isHovered = hoveredSession === s.id
              return (
                <div 
                  key={s.id}
                  onMouseEnter={() => setHoveredSession(s.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  style={{
                    padding: '9px 10px', borderRadius: '8px', cursor: 'pointer',
                    background: isActive ? 'var(--glow-color)' : isHovered ? 'var(--nav-link-hover)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.82rem', 
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-color)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isHovered && !isActive ? 'scale(1.02)' : 'scale(1)',
                    borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flexGrow: 1}} onClick={() => loadSession(s.id)}>
                    <MessageSquare size={13} style={{flexShrink: 0, opacity: 0.5}} />
                    <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'auto'}}>{s.title}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => deleteSession(s.id, e)}
                    style={{
                      background: 'none', border: 'none', color: '#ef4444',
                      cursor: 'pointer', padding: '3px',
                      opacity: isHovered ? 0.7 : 0,
                      display: 'flex', alignItems: 'center',
                      transition: 'all 0.2s', transform: isHovered ? 'scale(1)' : 'scale(0.8)'
                    }}
                    title="حذف المحادثة"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
            {savedSessions.length === 0 && (
              <div style={{color: '#3a3a5a', fontSize: '0.78rem', textAlign: 'center', marginTop: '3rem', lineHeight: 1.6}}>
                <MessageSquare size={24} style={{margin: '0 auto 8px', display: 'block', opacity: 0.3}} />
                لا يوجد محادثات سابقة
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Main Chat Area ===== */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--bg-color)', overflow: 'hidden' }}>
        
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 100,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--btn-sec-hover)'; e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--panel-bg)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Welcome Screen */}
        {showWelcome && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexGrow: 1, padding: '2rem', textAlign: 'center',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <div style={{
              width: '70px', height: '70px', borderRadius: '20px', 
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
              boxShadow: '0 8px 32px rgba(99,102,241,0.1)'
            }}>
              <Sparkles size={30} color="#8b8bff" />
            </div>
            <h1 style={{
              fontSize: '2rem', fontWeight: 700, marginBottom: '0.6rem',
              background: 'var(--nav-title)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              {isAdmin ? 'مرحبا بك أيها المدير' : 'كيف يمكنني مساعدتك؟'}
            </h1>
            <p style={{color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', lineHeight: 1.7}}>
              {isAdmin 
                ? 'اسأل أي سؤال وسيجيبك الذكاء الاصطناعي ويحفظ الإجابة تلقائياً' 
                : 'اكتب سؤالك وسأبحث لك عن الإجابة المناسبة'}
            </p>
            
            {/* Quick suggestion chips */}
            <div style={{display: 'flex', gap: '8px', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center'}}>
              {['ما هي ساعات العمل؟', 'How to contact support?', 'ما هي الخدمات المتاحة؟'].map((q, i) => (
                <button key={i} onClick={() => sendQuestion(q)} style={{
                  background: 'var(--btn-sec-bg)', border: '1px solid var(--border-color)',
                  color: 'var(--text-color)', padding: '8px 16px', borderRadius: '20px',
                  cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--btn-sec-hover)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--btn-sec-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.transform = 'scale(1) translateY(0)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!showWelcome && (
          <div className="chat-container" style={{ flexGrow: 1, paddingBottom: '130px', paddingRight: '12px' }}>
            {messages.map((msg) => {
              const isAr = /[\u0600-\u06FF]/.test(msg.text)
              return (
                <div key={msg.id} className={`message ${msg.sender === 'user' ? 'message-user' : 'message-ai'}`}>
                  <div style={{ marginBottom: '6px', opacity: 0.7, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {msg.sender === 'user' 
                      ? <><User size={14}/> <span>You</span></> 
                      : <><Bot size={14} style={{color: 'var(--accent-primary)'}}/> <span>AI Agent</span></>
                    }
                    
                    {msg.sender === 'ai' && msg.answeredFromFaq !== undefined && (
                      <span style={{
                        marginLeft: '6px', 
                        background: msg.answeredFromFaq ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)', 
                        color: msg.answeredFromFaq ? '#34d399' : '#818cf8', 
                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600
                      }}>
                        {msg.answeredFromFaq ? '🗄️ DB' : '🤖 AI'}
                      </span>
                    )}
                    
                    {msg.confidenceScore != null && !msg.isEscalated && (
                      <span style={{marginLeft: 'auto', color: '#555', fontSize: '0.7rem'}}>
                        {Math.round(msg.confidenceScore * 100)}%
                      </span>
                    )}
                  </div>
                  <div dir={isAr ? 'rtl' : 'ltr'} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', letterSpacing: '0.1px' }}>{msg.text}</div>
                  
                  {msg.isEscalated && (
                    <div style={{ marginTop: '10px' }}>
                      <button onClick={() => navigate('/support-ticket')} style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none',
                        padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        ⚠️ التواصل مع الدعم / Contact Support
                      </button>
                    </div>
                  )}

                  {msg.followUps && msg.followUps.length > 0 && (
                    <div style={{marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                      {msg.followUps.map((fu, idx) => (
                        <button key={idx} onClick={() => sendQuestion(fu)} style={{
                          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                          color: '#a5b4fc', padding: '6px 14px', borderRadius: '18px', 
                          cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontFamily: 'inherit'
                        }}
                        onMouseOver={e => { e.target.style.background = 'rgba(99,102,241,0.18)'; e.target.style.transform = 'translateY(-1px)' }}
                        onMouseOut={e => { e.target.style.background = 'rgba(99,102,241,0.08)'; e.target.style.transform = 'translateY(0)' }}
                        >{fu}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="message message-ai">
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Bot size={14} style={{color: 'var(--accent-primary)', animation: 'typingPulse 1s infinite'}} />
                  <div className="loading-dots"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* ===== Input Area ===== */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, var(--bg-color) 75%, transparent)',
          padding: '2rem 2rem 1rem'
        }}>
          {(!isAdmin && lockoutUntil && Date.now() < lockoutUntil) ? (
            <div style={{ 
              background: 'var(--panel-bg)', backdropFilter: 'blur(20px)',
              padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxWidth: '720px', margin: '0 auto', textAlign: 'center'
            }}>
              <p style={{ color: 'var(--error-color)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                لقد استهلكت الحد اليومي المسموح سيتم أعادة فتح المحادثة بعد 3 ساعات
              </p>
              <button onClick={openPricing} className="btn btn-secondary" style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16}/> ترقية الخطة
              </button>
            </div>
          ) : (
          <>
          <form onSubmit={e => { e.preventDefault(); sendQuestion(input) }} style={{ 
            display: 'flex', gap: '8px', 
            background: 'var(--panel-bg)', 
            backdropFilter: 'blur(20px)',
            padding: '6px 8px 6px 16px', 
            borderRadius: '24px', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px var(--glow-color)',
            maxWidth: '720px', margin: '0 auto',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'scale(1.01) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), 0 0 0 2px var(--glow-color)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px var(--glow-color)' }}
          >
            <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', position: 'relative'}}>
              <input 
                type="text" 
                placeholder="اكتب سؤالك هنا... / Ask anything..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%', background: 'transparent', border: 'none', 
                  color: 'var(--text-color)', fontSize: '0.92rem', padding: '10px 70px 10px 0',
                  outline: 'none', fontFamily: 'inherit'
                }}
                dir="auto"
              />
              <button type="button" onClick={() => {
                const synth = window.speechSynthesis;
                if (synth) {
                  // iOS Workaround: Unlock speech synthesis synchronously on user interaction
                  const utterance = new SpeechSynthesisUtterance('');
                  utterance.volume = 0;
                  synth.speak(utterance);
                }
                setShowVoiceMode(true);
              }} style={{
                position: 'absolute', right: '36px',
                background: 'none', border: 'none', cursor: 'pointer', 
                color: '#444', padding: '6px', borderRadius: '50%', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center'
              }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-color)'} onMouseOut={e => e.currentTarget.style.color = '#444'} title="المحادثة الصوتية (Voice Mode)">
                <Headphones size={18} />
              </button>
              <button type="button" onClick={toggleRecording} style={{
                position: 'absolute', right: '4px',
                background: isRecording ? 'rgba(239,68,68,0.15)' : 'none', 
                border: 'none', cursor: 'pointer', 
                color: isRecording ? '#ef4444' : '#444',
                padding: '6px', borderRadius: '50%', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center'
              }}>
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button type="submit" style={{
              background: input.trim() ? 'var(--btn-bg)' : 'var(--btn-sec-bg)', 
              color: input.trim() ? 'var(--btn-text)' : 'var(--text-muted)',
              border: 'none', borderRadius: '50%', width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s', flexShrink: 0,
              boxShadow: input.trim() ? '0 4px 12px var(--glow-color)' : 'none'
            }} disabled={isLoading || !input.trim()}>
              <Send size={15} style={{marginLeft: '1px'}} />
            </button>
          </form>
          <div style={{textAlign: 'center', marginTop: '8px', fontSize: '0.68rem', color: '#333'}}>
            AI Support Agent can make mistakes. Please verify important info.
          </div>
          </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content glass-panel" style={{
            width: '90%', maxWidth: '400px', textAlign: 'center', padding: '2rem'
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#ef4444'
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>حذف المحادثة</h3>
            <p style={{color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5'}}>
              هل أنت متأكد من رغبتك في حذف هذه المحادثة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
              <button className="btn btn-secondary" onClick={cancelDeleteSession} style={{flex: 1}}>
                إلغاء
              </button>
              <button className="btn btn-delete" onClick={confirmDeleteSession} style={{
                flex: 1, background: '#ef4444', borderColor: '#ef4444'
              }}>
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Mode Modal */}
      {showVoiceMode && (
        <VoiceModeModal 
          onClose={() => setShowVoiceMode(false)}
          onVoiceMessage={handleVoiceMessage}
        />
      )}
    </div>
  )
}
