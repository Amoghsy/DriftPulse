import { useState } from 'react';
import { Search, HelpCircle, Book, MessageSquare, Video, ChevronRight, FileText, Shield } from 'lucide-react';

const FAQS = [
  { q: 'How is the Trust Score calculated?', a: 'The Trust Score is a composite metric derived from device behavior, patch level, configuration drift, and recent anomaly detections.' },
  { q: 'What does Quarantine Device do?', a: 'Quarantining isolates the device at the switch-level, preventing it from communicating with other resources until the isolation is lifted.' },
  { q: 'Can I export logs to my SIEM?', a: 'Yes. Configure Syslog or API forwarding in Settings to automatically send alerts to Splunk, QRadar, or Sentinel.' },
  { q: 'How do I add a new IoT device?', a: 'Devices are discovered automatically via passive network monitoring. Ensure the device is connected to a monitored VLAN.' },
];

const ARTICLES = [
  'Configuring Custom Alert Thresholds',
  'Understanding Anomaly Baselines',
  'Integrating with Active Directory',
  'Exporting Compliance Reports',
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filtered = FAQS.filter(f =>
    !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content fade-in" style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero */}
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '2px solid var(--accent)' }}>
        {/* subtle glow behind */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 20px rgba(34,211,238,0.18)' }}>
            <HelpCircle size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>How can we help you?</h1>

          <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search FAQs, docs, or troubleshooting guides…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dp-input"
              style={{ paddingLeft: '2.75rem', paddingRight: '1.25rem', borderRadius: 9999, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { Icon: Book,         label: 'Documentation',    sub: 'Detailed guides on configuring and managing DriftPulse.', color: 'rgba(99,102,241,0.18)', fg: '#818cf8' },
          { Icon: Video,        label: 'Video Tutorials',  sub: 'Step-by-step visual guides for advanced anomaly detection.', color: 'rgba(34,211,238,0.12)', fg: 'var(--accent)' },
          { Icon: MessageSquare,label: 'Community Forum',  sub: 'Connect with security engineers and share custom rules.',  color: 'rgba(250,204,21,0.12)', fg: '#facc15' },
        ].map(({ Icon, label, sub, color, fg }) => (
          <div key={label} className="glass-panel help-quick-card" style={{ padding: '1.5rem', cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', transition: 'transform 0.2s ease' }}>
              <Icon size={22} style={{ color: fg }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{label}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* FAQs + Resources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '2rem' }}>

        {/* FAQs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={17} style={{ color: 'var(--accent)' }} /> Frequently Asked Questions
            </h2>
            <button className="btn-outline" style={{ fontSize: '0.78rem', padding: '0.25rem 0.8rem' }}>View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((faq, i) => (
              <div
                key={i}
                className="glass-panel"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.2s', borderColor: openFaq === i ? 'rgba(34,211,238,0.35)' : undefined }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.88rem', color: openFaq === i ? 'var(--accent)' : 'var(--text-primary)' }}>{faq.q}</h4>
                  <ChevronRight size={15} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '0.6rem' }}>{faq.a}</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>No results for "{searchQuery}"</div>
            )}
          </div>
        </div>

        {/* Resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="glass-panel settings-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileText size={17} style={{ color: 'var(--accent)' }} /> Popular Articles
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ARTICLES.map((article, i) => (
                <a
                  key={i} href="#"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)', borderBottom: i < ARTICLES.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', borderRadius: 6, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span>{article}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </a>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '3px solid rgba(34,211,238,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -20, right: -18, opacity: 0.06 }}>
              <Shield size={130} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>Still need help?</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Our dedicated enterprise support team is available 24/7 for critical issues.
              </p>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                <MessageSquare size={15} /> Contact Support
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
