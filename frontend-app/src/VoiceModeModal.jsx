import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

export default function VoiceModeModal({ onClose, onVoiceMessage, language = 'ar-SA' }) {
  const [state, setState] = useState('starting');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const resumeIntervalRef = useRef(null);
  const isClosedRef = useRef(false);
  const stateRef = useRef('starting');
  const isMutedRef = useRef(false);
  const onVoiceMessageRef = useRef(onVoiceMessage);

  // Keep refs in sync
  useEffect(() => { onVoiceMessageRef.current = onVoiceMessage; }, [onVoiceMessage]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    isClosedRef.current = false;

    // --- Speech Recognition Setup ---
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("عذراً، متصفحك لا يدعم ميزة التعرف على الصوت. يرجى استخدام Chrome أو Edge.");
      onClose();
      return;
    }

    // Preload TTS voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language;
    recognitionRef.current = rec;

    rec.onstart = () => {
      console.log('[VoiceMode] Mic started');
    };

    rec.onaudiostart = () => {
      console.log('[VoiceMode] Audio capture started');
    };

    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      console.log('[VoiceMode] Transcript:', text);
      setTranscript(text);
      currentTranscriptRef.current = text;
    };

    rec.onspeechend = () => {
      console.log('[VoiceMode] Speech ended');
    };

    rec.onend = () => {
      console.log('[VoiceMode] Recognition ended. State:', stateRef.current);
      if (isClosedRef.current) return;

      const text = currentTranscriptRef.current.trim();
      if (text) {
        // User said something → process it
        doProcess(text);
      } else {
        // No speech detected → restart if still listening
        if (stateRef.current === 'listening' && !isMutedRef.current) {
          setTimeout(() => tryStartRecognition(), 300);
        }
      }
    };

    rec.onerror = (e) => {
      console.warn('[VoiceMode] Recognition error:', e.error);
      if (isClosedRef.current) return;
      if (e.error === 'not-allowed') {
        alert('يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.');
        onClose();
        return;
      }
      // For other errors, try to restart
      if (!isMutedRef.current && stateRef.current === 'listening') {
        setTimeout(() => tryStartRecognition(), 500);
      }
    };

    // Start listening
    setState('listening');
    stateRef.current = 'listening';
    currentTranscriptRef.current = '';
    setTimeout(() => tryStartRecognition(), 100);

    return () => {
      console.log('[VoiceMode] Cleanup');
      isClosedRef.current = true;
      try { rec.abort(); } catch(e) {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
  }, []);

  function tryStartRecognition() {
    if (isClosedRef.current || isMutedRef.current) return;
    currentTranscriptRef.current = '';
    setTranscript('');
    try {
      recognitionRef.current?.start();
    } catch(e) {
      console.warn('[VoiceMode] Could not start recognition:', e.message);
      // Retry after a short delay
      setTimeout(() => {
        if (!isClosedRef.current && !isMutedRef.current) {
          try { recognitionRef.current?.start(); } catch(err) {}
        }
      }, 500);
    }
  }

  async function doProcess(text) {
    if (isClosedRef.current) return;
    setState('processing');
    stateRef.current = 'processing';
    setTranscript(text);
    try { recognitionRef.current?.abort(); } catch(e) {}

    try {
      console.log('[VoiceMode] Sending to API:', text);
      const answer = await onVoiceMessageRef.current(text);
      console.log('[VoiceMode] Got answer:', answer?.substring(0, 50));
      if (!isClosedRef.current && answer) {
        setAiResponse(answer);
        doSpeak(answer);
      } else if (!isClosedRef.current) {
        goBackToListening();
      }
    } catch(err) {
      console.error('[VoiceMode] API error:', err);
      if (!isClosedRef.current) {
        const msg = "عذراً، حدث خطأ في الاتصال.";
        setAiResponse(msg);
        doSpeak(msg);
      }
    }
  }

  function doSpeak(text) {
    const synth = window.speechSynthesis;
    if (!synth || isClosedRef.current || !text) {
      goBackToListening();
      return;
    }

    synth.cancel();
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);

    setState('speaking');
    stateRef.current = 'speaking';

    console.log('[VoiceMode] Speaking:', text.substring(0, 50));

    // Split into shorter chunks for Chrome compatibility
    const chunks = text.match(/[^.!?،؟!]+[.!?،؟!]?\s*/g) || [text];
    let idx = 0;

    function nextChunk() {
      if (isClosedRef.current || idx >= chunks.length) {
        if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
        console.log('[VoiceMode] Finished speaking');
        if (!isClosedRef.current) {
          setTimeout(() => goBackToListening(), 300);
        }
        return;
      }

      const chunk = chunks[idx].trim();
      if (!chunk) { idx++; nextChunk(); return; }

      const utt = new SpeechSynthesisUtterance(chunk);
      utt.lang = language;
      utt.rate = 1.05; // Slightly faster for snappier feel
      utt.volume = 1;

      // Pick a voice
      const voices = synth.getVoices();
      if (voices.length > 0) {
        const langCode = language.split('-')[0];
        let voice = voices.find(v => v.lang === language);
        if (!voice) voice = voices.find(v => v.lang.startsWith(langCode));
        if (!voice) voice = voices[0];
        utt.voice = voice;
        console.log('[VoiceMode] Using voice:', voice.name, voice.lang);
      }

      utt.onend = () => { idx++; nextChunk(); };
      utt.onerror = (e) => {
        console.error('[VoiceMode] TTS chunk error:', e);
        idx++; nextChunk();
      };

      synth.speak(utt);
    }

    nextChunk();

    // Chrome workaround: resume every 3s to prevent stalling
    resumeIntervalRef.current = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 3000);
  }

  function goBackToListening() {
    if (isClosedRef.current || isMutedRef.current) return;
    setState('listening');
    stateRef.current = 'listening';
    setTranscript('');
    setAiResponse('');
    currentTranscriptRef.current = '';
    setTimeout(() => tryStartRecognition(), 150);
  }

  function handleMuteToggle() {
    if (isMuted) {
      // Unmute → start listening
      setIsMuted(false);
      isMutedRef.current = false;
      goBackToListening();
    } else {
      // Mute → stop everything
      setIsMuted(true);
      isMutedRef.current = true;
      try { recognitionRef.current?.abort(); } catch(e) {}
      setState('idle');
      stateRef.current = 'idle';
    }
  }

  function handleClose() {
    isClosedRef.current = true;
    try { recognitionRef.current?.abort(); } catch(e) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    onClose();
  }

  const colors = {
    listening: '#6366f1',
    processing: '#f59e0b',
    speaking: '#10b981',
    idle: '#555',
    starting: '#555'
  };
  const color = colors[state] || '#555';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(30,30,40,0.98), rgba(10,10,15,1))',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, color: 'white', overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none', transition: 'background 0.5s ease',
        animation: 'ambientGlow 4s ease-in-out infinite alternate'
      }} />

      {/* Close */}
      <button onClick={handleClose} style={{
        position: 'absolute', top: '2rem', right: '2rem',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', cursor: 'pointer', padding: '12px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
        backdropFilter: 'blur(10px)', zIndex: 100
      }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
        <X size={24} />
      </button>

      {/* Orb */}
      <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Ripples */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <div className="ripple" style={{ borderColor: color, animationDuration: state === 'speaking' ? '1.5s' : '2.5s', animationDelay: '0s' }} />
            <div className="ripple" style={{ borderColor: color, animationDuration: state === 'speaking' ? '1.5s' : '2.5s', animationDelay: state === 'speaking' ? '0.5s' : '0.8s' }} />
            <div className="ripple" style={{ borderColor: color, animationDuration: state === 'speaking' ? '1.5s' : '2.5s', animationDelay: state === 'speaking' ? '1.0s' : '1.6s' }} />
          </>
        )}

        {/* Core Orb */}
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color}, #0f172a)`,
          boxShadow: `0 0 60px ${color}66, inset 0 0 20px rgba(255,255,255,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: state === 'listening' ? 'breathe 2s ease-in-out infinite' : 
                     state === 'processing' ? 'pulse 1.5s ease-in-out infinite' : 
                     state === 'speaking' ? 'breathe 1s ease-in-out infinite' : 'none',
          position: 'relative', zIndex: 10
        }}>
          {state === 'processing' && <Loader2 size={50} color="white" style={{animation: 'rotate 1s linear infinite'}} />}
          {state === 'listening' && <Mic size={50} color="white" />}
          {state === 'speaking' && <Volume2 size={50} color="white" />}
          {(state === 'idle' || state === 'starting') && <MicOff size={50} color="white" />}
        </div>
      </div>

      {/* Status */}
      <h3 style={{
        marginTop: '3.5rem', fontSize: '1.4rem', fontWeight: '500', letterSpacing: '0.5px',
        background: `linear-gradient(to right, #fff, ${color})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        transition: 'all 0.3s ease'
      }}>
        {state === 'listening' ? 'تحدث الآن...' : 
         state === 'processing' ? 'جاري المعالجة...' :
         state === 'speaking' ? 'النموذج يتحدث...' :
         state === 'starting' ? 'جاري التحضير...' : 'متوقف مؤقتاً'}
      </h3>

      {/* Text display */}
      <div style={{ 
        marginTop: '1.5rem', minHeight: '4rem', maxHeight: '180px', overflowY: 'auto', 
        maxWidth: '85%', textAlign: 'center', padding: '1rem',
        background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
        opacity: (transcript || aiResponse) ? 1 : 0, transform: (transcript || aiResponse) ? 'translateY(0)' : 'translateY(10px)'
      }} dir="auto">
        {state === 'speaking' && aiResponse && (
          <p style={{fontSize: '1.15rem', color: '#34d399', lineHeight: '1.8', margin: 0, fontWeight: 500}}>{aiResponse}</p>
        )}
        {(state === 'listening' || state === 'processing') && transcript && (
          <p style={{fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.8', margin: 0}}>{transcript}</p>
        )}
      </div>

      {/* Controls */}
      <div style={{marginTop: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'center', zIndex: 10}}>
        <button onClick={handleMuteToggle} style={{
          background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
          color: isMuted ? '#ef4444' : 'white',
          border: '1px solid ' + (isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'),
          padding: '16px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isMuted ? '0 0 20px rgba(239,68,68,0.2)' : 'none'
        }} title={isMuted ? 'تشغيل الميكروفون' : 'إيقاف الميكروفون'}>
          {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
        </button>

        <button onClick={handleClose} style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
          border: 'none', boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
          padding: '14px 32px', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600
        }} onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
          <X size={20} strokeWidth={2.5} /> إنهاء المحادثة
        </button>
      </div>
      
      <style>{`
        .ripple {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 2px solid;
          animation: ripple linear infinite;
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ambientGlow {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
