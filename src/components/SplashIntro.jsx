export default function SplashIntro() {
  return (
    <section className="splash-intro" aria-label="Kynvor AI loading">
      <div className="splash-stars" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, index) => <span key={index} />)}
      </div>
      <div className="splash-orbit">
        <span className="splash-ring outer" />
        <span className="splash-ring middle" />
        <span className="splash-ring inner" />
        <span className="splash-scan" />
        <div className="splash-core">
          <img src="/logo.png" alt="" />
        </div>
      </div>
      <div className="splash-copy">
        <span>Kynvor AI</span>
        <strong>Your Personal AI Guide</strong>
      </div>
    </section>
  )
}
