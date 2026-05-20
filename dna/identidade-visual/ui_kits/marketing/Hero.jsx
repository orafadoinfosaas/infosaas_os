/* Hero.jsx — full-bleed orange hero with oversized símbolo overlay */
const Hero = ({ onPrimary, onSecondary }) => (
  <section style={heroStyles.wrap}>
    {/* Decorative oversized símbolo, faded onto the orange */}
    <img src="../../assets/logos/simbolo-laranja.svg" alt="" aria-hidden="true" style={heroStyles.glyph} />

    <div style={heroStyles.inner}>
      <div style={heroStyles.eyebrow}>Studio · Estratégia → Entrega</div>
      <h1 style={heroStyles.headline}>
        <span style={heroStyles.line}>Pensa junto.</span>
        <span style={heroStyles.line}>Entrega do início ao fim.</span>
        <span style={heroStyles.line}>Sem enrolação.</span>
      </h1>
      <p style={heroStyles.lead}>
        Um studio que desenvolve e implementa soluções inteligentes para empresas que faturam R$ 3 milhões ou mais por ano — nos setores educacional, saúde e enterprise.
      </p>
      <div style={heroStyles.actions}>
        <button className="btn btn-secondary" onClick={onPrimary}>
          Agendar conversa <span className="btn-arrow">→</span>
        </button>
        <button className="btn btn-ghost-light" onClick={onSecondary}>
          Ver produtos
        </button>
      </div>
    </div>
  </section>
);

const heroStyles = {
  wrap: {
    position: "relative", overflow: "hidden",
    background: "var(--laranja)", color: "#fff",
    padding: "120px 48px 132px",
  },
  glyph: {
    position: "absolute",
    right: "-6%", top: "-12%",
    width: "55%", maxWidth: 920,
    filter: "brightness(0.78) contrast(1.05)",
    pointerEvents: "none",
    userSelect: "none",
  },
  inner: { position: "relative", maxWidth: 1240, margin: "0 auto", zIndex: 1 },
  eyebrow: {
    font: "500 12px/1 var(--font-sans)",
    letterSpacing: ".14em", textTransform: "uppercase",
    color: "rgba(255,255,255,.8)", marginBottom: 28,
  },
  headline: {
    font: "900 clamp(48px, 6.4vw, 96px)/0.95 var(--font-sans)",
    letterSpacing: "-0.03em",
    margin: "0 0 32px",
    color: "#fff",
    maxWidth: "16ch",
  },
  line: { display: "block" },
  lead: {
    font: "400 19px/1.5 var(--font-sans)",
    color: "rgba(255,255,255,.92)",
    maxWidth: "52ch", margin: "0 0 40px",
  },
  actions: { display: "flex", gap: 12, flexWrap: "wrap" },
};

window.Hero = Hero;
