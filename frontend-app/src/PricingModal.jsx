import React from 'react';
import { X, Check, Star, Zap, Infinity, Clock, MessageSquare, Image as ImageIcon, Shield, Bot, Mic, Code, Search, Plus } from 'lucide-react';

export default function PricingModal({ onClose }) {
  const plans = [
    {
      name: 'المجانية',
      price: '0',
      currency: 'ر.س',
      period: 'شهر /',
      buttonText: 'خطتك الحالية',
      isCurrent: true,
      highlight: false,
      features: [
        { text: 'النموذج الأساسي', icon: <Bot size={16}/> },
        { text: 'إمكانية محدودة لعدد الرسائل وعمليات التحميل', icon: <MessageSquare size={16}/> },
        { text: 'إمكانية محدودة لإنشاء الصور', icon: <ImageIcon size={16}/> },
        { text: 'سعة ذاكرة محدودة', icon: <Clock size={16}/> },
      ]
    },
    {
      name: 'Go',
      price: '35',
      currency: 'ر.س',
      period: 'شهر /',
      buttonText: 'الترقية إلى Go',
      isCurrent: false,
      highlight: false,
      features: [
        { text: 'النموذج الأساسي', icon: <Bot size={16}/> },
        { text: 'المزيد من الرسائل والتحميلات', icon: <MessageSquare size={16}/> },
        { text: 'إنشاء المزيد من الصور', icon: <ImageIcon size={16}/> },
        { text: 'ذاكرة أطول', icon: <Clock size={16}/> },
        { text: 'وضع صوتي موسع', icon: <Mic size={16}/> },
      ]
    },
    {
      name: 'Plus',
      badge: 'الأكثر استخداماً',
      price: '90',
      currency: 'ر.س',
      period: 'شهر /',
      buttonText: 'الترقية إلى Plus',
      isCurrent: false,
      highlight: true,
      features: [
        { text: 'النماذج المتقدمة', icon: <Star size={16}/> },
        { text: 'إنشاء متقدم للصور', icon: <ImageIcon size={16}/> },
        { text: 'ذاكرة موسعة عبر الدردشات المختلفة', icon: <Clock size={16}/> },
        { text: 'كتابة الأكواد البرمجية', icon: <Code size={16}/> },
        { text: 'تم توسيع نطاق البحث المتعمق', icon: <Search size={16}/> },
      ]
    },
    {
      name: 'Pro',
      price: '430',
      currency: 'ر.س',
      period: 'شهر /',
      buttonText: 'الترقية إلى Pro',
      isCurrent: false,
      highlight: false,
      features: [
        { text: 'إضافة إلى Plus كل ما في:', icon: <Plus size={16}/> },
        { text: 'استخدام أكثر بخمسة أضعاف', icon: <Zap size={16}/> },
        { text: 'النماذج المتقدمة Pro', icon: <Star size={16}/> },
        { text: 'أقصى قدر من الوصول إلى', icon: <Infinity size={16}/> },
        { text: 'الحد الأقصى من البحث المتعمق', icon: <Search size={16}/> },
        { text: 'دردشة أساسية غير محدودة', icon: <MessageSquare size={16}/> },
        { text: 'عمليات إنشاء صور غير محدودة', icon: <ImageIcon size={16}/> },
      ]
    }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 9999, overflowY: 'auto', padding: '1rem',
    }} dir="rtl">
      <div className="glass-panel" style={{
        width: '1200px', maxWidth: '100%',
        padding: '1.5rem', borderRadius: '16px',
        position: 'relative', display: 'flex', flexDirection: 'column',
        margin: 'auto 0' // Ensures it stays centered if smaller than screen
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'none', border: 'none', color: 'var(--text-color)',
          cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s'
        }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.7}>
          <X size={28} />
        </button>

        <h2 style={{textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem'}}>ترقية خطتك</h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem', width: '100%'
        }}>
          {plans.map((plan, idx) => (
            <div key={idx} style={{
              background: plan.highlight ? 'rgba(99, 102, 241, 0.1)' : 'var(--panel-bg)',
              border: plan.highlight ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column',
              position: 'relative', transition: 'transform 0.2s', cursor: 'default'
            }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              {plan.badge && (
                <span style={{
                  position: 'absolute', top: '1rem', left: '1rem',
                  background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)',
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold'
                }}>
                  {plan.badge}
                </span>
              )}

              <h3 style={{fontSize: '1.8rem', marginBottom: '1rem'}}>{plan.name}</h3>
              
              <div style={{display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1.5rem'}}>
                <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>{plan.currency}</span>
                <span style={{fontSize: '3rem', fontWeight: 'bold', lineHeight: 1}}>{plan.price}</span>
                <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{plan.period}</span>
              </div>

              <button style={{
                background: plan.highlight ? 'var(--accent-primary)' : (plan.isCurrent ? 'transparent' : 'var(--text-color)'),
                color: plan.highlight ? 'white' : (plan.isCurrent ? 'var(--text-muted)' : 'var(--bg-color)'),
                border: plan.isCurrent ? '1px solid var(--border-color)' : 'none',
                padding: '0.8rem', borderRadius: '24px', fontWeight: 'bold', marginBottom: '2rem',
                cursor: plan.isCurrent ? 'default' : 'pointer', transition: 'all 0.2s'
              }} onMouseOver={e => !plan.isCurrent && (e.currentTarget.style.transform = 'scale(1.02)')} onMouseOut={e => !plan.isCurrent && (e.currentTarget.style.transform = 'scale(1)')}>
                {plan.buttonText}
              </button>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1}}>
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                    <div style={{color: 'var(--text-muted)', marginTop: '2px'}}>{feature.icon}</div>
                    <span style={{fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-color)'}}>{feature.text}</span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
