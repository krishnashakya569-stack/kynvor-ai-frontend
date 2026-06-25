import {
  Bot,
  Download,
  FileText,
  Image,
  Lock,
  MessageSquare,
  Mic,
  Sparkles,
  Zap,
} from 'lucide-react'
import AnalogClock from './AnalogClock'

const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || '/downloads/kynvor-ai.apk'

const features = [
  { icon: MessageSquare, title: 'Smart chat', text: 'Ask questions, write content, solve problems, and continue saved conversations.' },
  { icon: Mic, title: 'Voice ready', text: 'Use speech features through the Kynvor AI assistant experience.' },
  { icon: FileText, title: 'File support', text: 'Work with PDFs, text, markdown, CSV, and JSON files from the chat.' },
  { icon: Image, title: 'Image understanding', text: 'Upload images and get helpful analysis from Kynvor AI.' },
]

const stats = [
  ['10K+', 'Questions Answered'],
  ['500+', 'Active Users'],
  ['24/7', 'Always Available'],
]

export default function LandingPage({ onOpenChat }) {
  return (
    <main className="site-shell">
      <div className="hero-focus-glow" />
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <span key={index} />)}
      </div>
      <div className="spark s1" />
      <div className="spark s2" />
      <div className="spark s3" />
      <div className="spark s4" />

      <header className="site-nav">
        <a className="brand-lockup" href="#" aria-label="Kynvor AI homepage">
          <img src="/logo.png" alt="Kynvor AI" className="navbar-logo" />
          <div>
            <strong>Kynvor AI</strong>
            <span>Your Personal AI Guide</span>
          </div>
        </a>
        <nav className="site-actions" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#download">Download</a>
          <button type="button" onClick={onOpenChat}>Open Chat</button>
        </nav>
      </header>

      <div className="clock-pin">
        <AnalogClock />
      </div>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> Built for helpful everyday AI</div>
          <h1>
            <span>Meet</span>
            <span className="hero-highlight">Kynvor</span>
            <span className="hero-ai">AI</span>
          </h1>
          <p>
            Your intelligent AI companion for learning, coding, research, productivity,
            file analysis, current affairs, and everyday problem solving. Built to guide,
            assist, and grow with you.
          </p>
          <div className="hero-buttons">
            <a className="primary-button" href={APK_DOWNLOAD_URL} download="KynvorAI-v1.0.apk">
              <Download size={18} />
              Download APK
            </a>
            <button className="secondary-button" type="button" onClick={onOpenChat}>
              <Bot size={18} />
              Use Web Chat
            </button>
          </div>
          <div className="trust-row">
            <span><Zap size={16} /> Fast Responses</span>
            <span><Bot size={16} /> AI Powered</span>
            <span><Lock size={16} /> Secure</span>
          </div>
          <div className="stats-row">
            {stats.map(([value, label]) => (
              <div className="stat-card" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-preview-wrapper">
          <div className="energy-glow" />
          <div className="energy-ring ring-a" />
          <div className="energy-ring ring-b" />
          <div className="energy-ring ring-c" />
          <div className="energy-ring ring-d" />

          <div className="chat-preview" aria-label="Kynvor AI chat preview">
            <div className="preview-top">
              <div className="brand-mark small">K</div>
              <div>
                <strong>Kynvor AI</strong>
                <span><i /> Assistant online</span>
              </div>
            </div>
            <div className="preview-messages">
              <div className="bubble user">Can you help me prepare for my exam?</div>
              <div className="bubble assistant">Yes. Share your subject and time available, and I will make a focused study plan.</div>
              <div className="bubble user">Also explain this PDF after I upload it.</div>
              <div className="bubble assistant">Upload it here. I can summarize key points, definitions, and likely questions.</div>
            </div>
            <div className="preview-dots" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      </section>

      <section id="download" className="download-band">
        <div className="download-icon"><Download size={28} /></div>
        <div>
          <h2>Download Kynvor AI for Android</h2>
          <p>Install the APK on your Android phone and use Kynvor AI as your personal assistant.</p>
        </div>
        <a className="primary-button compact" href={APK_DOWNLOAD_URL} download="KynvorAI-v1.0.apk">
          <Download size={18} />
          Download APK
        </a>
      </section>

      <section id="features" className="feature-grid">
        {features.map(({ icon: Icon, title, text }) => (
          <article className="feature-card" key={title}>
            <span className="feature-icon"><Icon size={22} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <button className="mascot-wrap" type="button" onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance("Hello, I'm Kynvor AI."))}>
        <div className="mascot">
          <div className="mascot-head"><span /><span /><i /></div>
          <div className="mascot-ear left" />
          <div className="mascot-ear right" />
          <div className="mascot-body"><img src="/logo.png" alt="" /></div>
          <div className="mascot-arm left" />
          <div className="mascot-arm right" />
          <div className="mascot-leg left" />
          <div className="mascot-leg right" />
        </div>
        <div className="speech-bubble">Need <strong>help</strong><br />studying?<small>I'm here for you!</small></div>
      </button>

      <footer className="site-footer">
        <p>Created by Krishna Shakya</p>
      </footer>
    </main>
  )
}