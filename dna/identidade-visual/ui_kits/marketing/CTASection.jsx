/* CTASection.jsx — closing CTA before footer */
const CTASection = ({ onPrimary }) => (
  <section style={cStyles.wrap}>
    <div className="container" style={cStyles.inner}>
      <div className="eyebrow">Conversa</div>
      <h2 style={cStyles.headline}>
        Antes de fechar com qualquer empresa, <span style={{ color: "var(--laranja)" }}>fale com a gente</span>.
      </h2>
      <p style={cStyles.lead}>
        Atendemos empresas que faturam R$ 3 milhões ou mais por ano, nos setores educacional, saúde e enterprise. Vagas limitadas a cada mês — preserva qualidade.
      </p>
      <div style={cStyles.actions}>
        <button className="btn btn-primary" onClick={onPrimary}>
          Agendar conversa <span className="btn-arrow">→</span>
        </button>
        <button className="btn btn-ghost-dark">Ver cases recentes</button>
      </div>
    </div>
  </section>
);

const cStyles = {
  wrap: { background: "var(--branco-off)", padding: "120px 48px" },
  inner: { display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start", maxWidth: 900 },
  headline: {
    font: "900 clamp(40px, 4.8vw, 72px)/0.98 var(--font-sans)",
    letterSpacing: "-0.025em",
    margin: 0,
    textWrap: "balance",
  },
  lead: { font: "400 18px/1.55 var(--font-sans)", color: "var(--fg-muted)", maxWidth: "52ch", margin: 0 },
  actions: { display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" },
};

window.CTASection = CTASection;
