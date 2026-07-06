import { useState, useEffect } from 'react'
import { Bot, LogOut, Sun, Moon, BrainCircuit } from 'lucide-react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import Chat from './Chat'
import Admin from './Admin'
import AdminLogin from './AdminLogin'
import SupportTicket from './SupportTicket'
import PricingModal from './PricingModal'
import { Sparkles } from 'lucide-react'

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [showPricing, setShowPricing] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    navigate('/')
  }

  // Determine active tab style based on current route
  const isChatActive = location.pathname === '/' || location.pathname === '/support-ticket'
  const isAdminActive = location.pathname.startsWith('/admin')

  return (
    <>
      <nav className="navbar">
        <Link to="/" style={{textDecoration: 'none', color: 'inherit'}} className="flex items-center gap-2">
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
            padding: '6px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <BrainCircuit size={24} color="white" strokeWidth={2.5} />
          </div>
          <h2 style={{
            background: 'linear-gradient(135deg, var(--text-color), #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            letterSpacing: '-0.5px'
          }}>Hijazi AI</h2>
        </Link>
        <div className="nav-links" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{
              padding: '0.4rem', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              background: 'var(--panel-bg)'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} color="var(--text-color)" /> : <Moon size={18} color="var(--text-color)" />}
          </button>
          <div style={{width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 5px'}}></div>
          {isAuthenticated ? (
            <>
              <span style={{color: '#8b5cf6', fontSize: '0.85rem', fontWeight: 'bold', marginRight: '10px'}}>Admin Mode</span>
              <Link to="/" className={`nav-link ${isChatActive ? 'active' : ''}`} style={{textDecoration: 'none'}}>Chat</Link>
              <Link to="/admin" className={`nav-link ${isAdminActive ? 'active' : ''}`} style={{textDecoration: 'none'}}>Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', marginLeft: '1rem'}}>
                <LogOut size={16}/> Logout
              </button>
            </>
          ) : (
            <>
              <span style={{color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 'bold', marginRight: '10px'}}>User Mode</span>
              <Link to="/" className={`nav-link ${isChatActive ? 'active' : ''}`} style={{textDecoration: 'none'}}>Chat</Link>
              <button onClick={() => setShowPricing(true)} className="btn btn-secondary" style={{padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-light)', marginLeft: '10px'}}>
                <Sparkles size={16} color="var(--accent-primary)"/> ترقية الخطة
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="app-container">
        <Routes>
          <Route path="/" element={<Chat isAdmin={isAuthenticated} openPricing={() => setShowPricing(true)} />} />
          <Route path="/support-ticket" element={<SupportTicket />} />
          <Route path="/admin/login" element={
            isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin setAuth={setIsAuthenticated} />
          } />
          <Route path="/admin" element={
            isAuthenticated ? <Admin /> : <Navigate to="/admin/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
