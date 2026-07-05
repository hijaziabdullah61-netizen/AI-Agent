import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Edit, X, AlertTriangle, Eye, Bot, User, Maximize2, Minimize2 } from 'lucide-react'

export default function Admin() {
  const [faqs, setFaqs] = useState([])
  const [escalated, setEscalated] = useState([])
  const [sessions, setSessions] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('faqs')
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [isModalExpanded, setIsModalExpanded] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteType, setDeleteType] = useState('faq')
  const [formData, setFormData] = useState({
    questionEn: '', questionAr: '', answerEn: '', answerAr: '', categoryId: 1
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionHistory, setSessionHistory] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type }), 3500)
  }

  useEffect(() => {
    fetchCategories()
    fetchFaqs()
    fetchEscalated()
    fetchSessions()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axios.get('https://ai-agent-production-4269.up.railway.app/api/categories')
      if (res.data.length === 0) {
        const catRes = await axios.post('https://ai-agent-production-4269.up.railway.app/api/categories', { nameAr: 'عام', nameEn: 'General' })
        setCategories([catRes.data])
      } else {
        setCategories(res.data)
      }
    } catch (e) { console.error("Error fetching categories", e) }
  }

  const fetchFaqs = async () => {
    try {
      const res = await axios.get('https://ai-agent-production-4269.up.railway.app/api/faqs')
      setFaqs(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchEscalated = async () => {
    try {
      const res = await axios.get('https://ai-agent-production-4269.up.railway.app/api/chat/history/all')
      setEscalated(res.data)
    } catch (e) { console.error(e) }
  }
  
  const fetchSessions = async () => {
    try {
      const res = await axios.get('https://ai-agent-production-4269.up.railway.app/api/chat/sessions')
      setSessions(res.data)
    } catch (e) { console.error(e) }
  }

  const viewSession = async (sessionId) => {
    try {
      const res = await axios.get(`https://ai-agent-production-4269.up.railway.app/api/chat/history/${sessionId}`)
      setSessionHistory(res.data)
      setActiveSessionId(sessionId)
      setShowSessionModal(true)
    } catch (e) { console.error(e) }
  }

  const handleAddClick = () => {
    setIsEditMode(false)
    setFormData({ questionEn: '', questionAr: '', answerEn: '', answerAr: '', categoryId: categories[0]?.id || 1 })
    setShowModal(true)
  }

  const handleEditClick = (faq) => {
    setIsEditMode(true)
    setEditId(faq.id)
    setFormData({
      questionEn: faq.questionEn,
      questionAr: faq.questionAr,
      answerEn: faq.answerEn,
      answerAr: faq.answerAr,
      categoryId: faq.categoryId || (categories.length > 0 ? categories[0].id : 1)
    })
    setShowModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (isEditMode) {
        await axios.put(`https://ai-agent-production-4269.up.railway.app/api/faqs/${editId}`, formData)
        showToast("تم تعديل السؤال بنجاح! ✅")
      } else {
        await axios.post('https://ai-agent-production-4269.up.railway.app/api/faqs', formData)
        showToast("تمت إضافة السؤال بنجاح! ✅")
      }
      setShowModal(false)
      fetchFaqs()
    } catch (e) {
      console.error(e)
      showToast("حدث خطأ أثناء الحفظ: \n" + (e.response?.data?.message || e.message), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      if (deleteType === 'faq') {
        await axios.delete(`https://ai-agent-production-4269.up.railway.app/api/faqs/${deleteConfirmId}`)
        fetchFaqs()
      } else {
        await axios.delete(`https://ai-agent-production-4269.up.railway.app/api/chat/history/${deleteConfirmId}`)
        fetchEscalated()
        fetchSessions()
      }
      setDeleteConfirmId(null)
      showToast("تم الحذف بنجاح! ✅")
    } catch (e) { 
      console.error(e)
      showToast("حدث خطأ أثناء محاولة الحذف: \n" + e.message + "\n\nتأكد من إعادة تشغيل الخادم (Backend).", 'error') 
    }
  }

  return (
    <>
      <div className="glass-panel" style={{position: 'relative'}}>
        <h2>Admin Dashboard</h2>
      
      <div className="tabs mt-4">
        <button className={`tab ${activeTab === 'faqs' ? 'active' : ''}`} onClick={() => setActiveTab('faqs')}>
          Manage FAQs
        </button>
        <button className={`tab ${activeTab === 'escalated' ? 'active' : ''}`} onClick={() => setActiveTab('escalated')}>
          All Questions
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          All Conversations
        </button>
      </div>

      {activeTab === 'faqs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3>FAQ Database</h3>
            <button className="btn" onClick={handleAddClick}>
              <Plus size={18} /> Add New FAQ
            </button>
          </div>
          
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Question (En)</th>
                  <th>Question (Ar)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map(faq => (
                  <tr key={faq.id}>
                    <td>{faq.id}</td>
                    <td>{faq.categoryNameEn || 'General'}</td>
                    <td>{faq.questionEn}</td>
                    <td dir="rtl">{faq.questionAr}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={() => handleEditClick(faq)} style={{padding: '0.4rem'}}><Edit size={16}/></button>
                        <button className="btn btn-secondary" onClick={() => { setDeleteConfirmId(faq.id); setDeleteType('faq'); }} style={{padding: '0.4rem', color: 'var(--error-color)'}}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {faqs.length === 0 && (
                  <tr><td colSpan="5" className="text-center">لا يوجد أسئلة.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'escalated' && (
        <div>
          <h3>All Questions & Answer Source</h3>
          <table className="data-table mt-4">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Question</th>
                <th>Source</th>
                <th>Language</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {escalated.map(conv => (
                <tr key={conv.id}>
                  <td>{conv.id}</td>
                  <td dir={conv.language === 'ar' ? 'rtl' : 'ltr'}>{conv.userQuestion}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      letterSpacing: '0.02em',
                      background: conv.answeredFromFaq
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08))'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.08))',
                      color: conv.answeredFromFaq ? '#34d399' : '#a78bfa',
                      border: conv.answeredFromFaq ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: conv.answeredFromFaq ? '#34d399' : '#a78bfa',
                        boxShadow: conv.answeredFromFaq ? '0 0 6px #34d399' : '0 0 6px #a78bfa',
                      }}></span>
                      {conv.answeredFromFaq ? 'FAQ Database' : 'AI Model'}
                    </span>
                  </td>
                  <td>{conv.language}</td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                      <span style={{fontWeight: '500', fontSize: '0.85rem'}}>{new Date(conv.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                      <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>{new Date(conv.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary" style={{padding: '0.4rem'}}>Reply</button>
                      <button className="btn btn-secondary" onClick={() => { setDeleteConfirmId(conv.id); setDeleteType('conversation'); }} style={{padding: '0.4rem', color: 'var(--error-color)'}}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {escalated.length === 0 && (
                <tr><td colSpan="6" className="text-center">No escalated questions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div>
          <h3>Chat Sessions</h3>
          <div style={{maxHeight: '600px', overflowY: 'auto'}}>
            <table className="data-table mt-4">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>First Message</th>
                  <th>Messages</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.sessionId}>
                    <td style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{s.sessionId}</td>
                    <td dir="auto">{s.firstMessage}</td>
                    <td><span style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px'}}>{s.messageCount}</span></td>
                    <td>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                        <span style={{fontWeight: '500', fontSize: '0.85rem'}}>{new Date(s.updatedAt).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>{new Date(s.updatedAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true})}</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => viewSession(s.sessionId)} style={{padding: '0.4rem'}}><Eye size={16}/> View</button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan="5" className="text-center">No sessions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div> {/* End of glass-panel */}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="glass-panel modal-content" style={{width: '400px', maxWidth: '90%', textAlign: 'center'}}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--error-color)'}}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{marginBottom: '0.5rem', color: 'white'}}>تأكيد الحذف / Confirm Deletion</h3>
            <p style={{marginBottom: '2rem', color: '#94a3b8', fontSize: '0.95rem'}}>
              هل أنت متأكد من عملية الحذف؟ لا يمكن التراجع عن هذا الإجراء.<br/>
              Are you sure you want to delete this?
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>إلغاء / Cancel</button>
              <button className="btn btn-delete" style={{background: 'var(--error-color)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'}} onClick={confirmDelete}>
                حذف / Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit FAQ Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel modal-content" style={{
            width: isModalExpanded ? '100vw' : '600px', 
            height: isModalExpanded ? '100vh' : 'auto',
            maxWidth: isModalExpanded ? '100vw' : '90%', 
            maxHeight: isModalExpanded ? '100vh' : '90vh', 
            borderRadius: isModalExpanded ? '0' : '16px',
            overflowY: 'auto',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3>{isEditMode ? 'تعديل السؤال (Edit FAQ)' : 'إضافة سؤال جديد (Add FAQ)'}</h3>
              <div style={{display: 'flex', gap: '8px'}}>
                <button onClick={() => setIsModalExpanded(!isModalExpanded)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding: '4px', display: 'flex', alignItems: 'center'}}>
                  {isModalExpanded ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                </button>
                <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', color:'var(--error-color)', cursor:'pointer', padding: '4px', display: 'flex', alignItems: 'center'}}><X size={24}/></button>
              </div>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem'}}>Category (القسم)</label>
                <select required className="input-field" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nameEn} - {c.nameAr}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem'}}>السؤال (عربي)</label>
                <input required className="input-field" dir="rtl" value={formData.questionAr} onChange={e => setFormData({...formData, questionAr: e.target.value})} placeholder="اكتب السؤال بالعربية..." />
              </div>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem'}}>Question (English)</label>
                <input required className="input-field" dir="ltr" value={formData.questionEn} onChange={e => setFormData({...formData, questionEn: e.target.value})} placeholder="Type question in English..." />
              </div>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem'}}>الإجابة (عربي)</label>
                <textarea required className="input-field" rows="3" dir="rtl" value={formData.answerAr} onChange={e => setFormData({...formData, answerAr: e.target.value})} placeholder="اكتب الإجابة بالعربية..." />
              </div>
              <div>
                <label style={{display:'block', marginBottom:'0.5rem'}}>Answer (English)</label>
                <textarea required className="input-field" rows="3" dir="ltr" value={formData.answerEn} onChange={e => setFormData({...formData, answerEn: e.target.value})} placeholder="Type answer in English..." />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel modal-content" style={{width: '700px', maxWidth: '90%', height: '80vh', display: 'flex', flexDirection: 'column'}}>
            <div className="flex justify-between items-center mb-4" style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
              <div>
                <h3>Session Details</h3>
                <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{activeSessionId}</span>
              </div>
              <button onClick={() => setShowSessionModal(false)} style={{background:'none', border:'none', color:'var(--text-color)', cursor:'pointer', padding: '4px', display: 'flex', transition: 'color 0.2s'}} onMouseOver={e => e.currentTarget.style.color = 'var(--error-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-color)'}><X size={24}/></button>
            </div>
            
            <div style={{flexGrow: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
              {sessionHistory.map(conv => (
                <div key={conv.id} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {/* User Bubble */}
                  <div style={{alignSelf: 'flex-end', background: 'var(--msg-user-bg)', color: 'var(--text-color)', padding: '10px 14px', borderRadius: '15px 15px 0 15px', maxWidth: '80%', border: '1px solid var(--border-color)'}}>
                    <div style={{fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}><User size={12}/> User</div>
                    <div dir="auto" style={{wordBreak: 'break-word'}}>{conv.userQuestion}</div>
                  </div>
                  
                  {/* AI Bubble */}
                  <div style={{alignSelf: 'flex-start', background: 'var(--btn-sec-bg)', color: 'var(--text-color)', padding: '10px 14px', borderRadius: '15px 15px 15px 0', maxWidth: '80%', border: '1px solid var(--border-color)'}}>
                    <div style={{fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <Bot size={12}/> AI Agent
                      <span style={{marginLeft: 'auto'}}>
                        {conv.answeredFromFaq ? '🗄️ DB' : '🤖 AI'} • {Math.round(conv.confidenceScore * 100)}%
                      </span>
                    </div>
                    <div dir="auto" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', wordBreak: 'break-word'}}>{conv.aiResponse}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? 'var(--error-color)' : 'var(--accent-primary)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'fadeInUp 0.3s ease-out',
          fontWeight: 500,
          whiteSpace: 'pre-wrap'
        }}>
          {toast.message}
        </div>
      )}
    </>
  )
}
