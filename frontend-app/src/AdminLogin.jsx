import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminLogin({ setAuth }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Basic frontend authentication
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('adminAuth', 'true')
      setAuth(true)
      navigate('/admin')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', textAlign: 'center', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'var(--btn-sec-bg)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
            <Lock size={40} color="var(--text-color)" />
          </div>
        </div>
        <h2 style={{ marginBottom: '2rem' }}>Login</h2>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Username" 
            dir="auto"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field" 
              placeholder="Password" 
              dir="auto"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
