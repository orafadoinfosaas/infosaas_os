/* Testimonial.jsx — pull quote on orange paper with portrait */
const Testimonial = () => (
  <section style={tStyles.wrap}>
    <div className="container" style={tStyles.inner}>
      <div style={tStyles.photoCol}>
        <div style={tStyles.photoFrame}>
          <img src="../../assets/banners/portrait-orange.png" alt="Cliente" style={tStyles.photo} />
        </div>
      </div>
      <div style={tStyles.quoteCol}>
        <div className="eyebrow" style={{ color: "rgba(255,255,255,.78)" }}>Cliente · Educação</div>
        <blockquote style={tStyles.quote}>
          &ldquo;O time da Infosaas pensou junto. Não receberam um escopo, executaram e sumiram — entenderam o negócio, ajustaram a rota com a gente e entregaram do jeito certo.&rdquo;
        </blockquote>
        <div style={tStyles.attr}>
          <div style={tStyles.name}>Diretora de Produto</div>
          <div style={tStyles.role}>Empresa do setor educacional</div>
        </div>
      </div>
    </div>
  </section>
);

const tStyles = {
  wrap: { background: "var(--laranja)", color: "#fff", padding: "120px 48px", overflow: "hidden", position: "relative" },
  inner: { display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 64, alignItems: "center" },
  photoCol: { position: "relative" },
  photoFrame: {
    aspectRatio: "4 / 5",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    background: "var(--laranja-press)",
    boxShadow: "0 30px 60px -20px rgba(0,0,0,.35)",
  },
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  quoteCol: { display: "flex", flexDirection: "column", gap: 24 },
  quote: {
    font: "700 clamp(28px, 2.6vw, 44px)/1.2 var(--font-sans)",
    letterSpacing: "-0.015em",
    color: "#fff", margin: 0,
    maxWidth: "22ch",
    textWrap: "balance",
  },
  attr: { display: "flex", flexDirection: "column", gap: 4 },
  name: { font: "700 16px/1 var(--font-sans)" },
  role: { font: "400 14px/1 var(--font-sans)", color: "rgba(255,255,255,.75)" },
};

window.Testimonial = Testimonial;
