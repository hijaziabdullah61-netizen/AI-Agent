import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SupportTicket() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send to backend
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2>تم استلام بلاغك / Ticket Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '2rem' }}>
          We have received your support request. Our team will contact you soon.
        </p>
        <button onClick={() => navigate('/')} className="btn">
          العودة للدردشة / Back to Chat
        </button>
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={20} /> Back
      </button>
      
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>التواصل مع الدعم الفني</h2>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Contact Human Support</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>الاسم / Name</label>
          <input 
            type="text" 
            className="input-field" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>البريد الإلكتروني / Email</label>
          <input 
            type="email" 
            className="input-field" 
            required
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>رسالتك / Your Message</label>
          <textarea 
            className="input-field" 
            rows="5"
            required
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            style={{ resize: 'vertical' }}
          ></textarea>
        </div>
        
        <button type="submit" className="btn" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <Send size={18} /> إرسال / Submit Ticket
        </button>
      </form>
    </div>
  )
}
