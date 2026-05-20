/* ProofBar.jsx — horizontal client logo strip */
const ProofBar = () => {
  const clients = [
    "G4 Educação",
    "V4 Company",
    "Instituto Singular",
    "Phlebo Academy",
    "Pandora Treinamentos",
    "Rufy",
    "Sem Codar",
    "Esporte Educa",
  ];
  return (
    <section style={proofStyles.wrap}>
      <div style={proofStyles.inner}>
        <div style={proofStyles.label}>
          Estão construindo com a gente
        </div>
        <div style={proofStyles.row}>
          {clients.map(c => <div key={c} style={proofStyles.cell}>{c}</div>)}
        </div>
      </div>
    </section>
  );
};

const proofStyles = {
  wrap: {
    background: "var(--branco)",
    borderTop: "1px solid var(--cinza-300)",
    borderBottom: "1px solid var(--cinza-300)",
    padding: "32px 48px",
  },
  inner: {
    maxWidth: 1240, margin: "0 auto",
    display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap",
  },
  label: {
    font: "500 11px/1.2 var(--font-sans)",
    letterSpacing: ".14em", textTransform: "uppercase",
    color: "var(--fg-muted)",
    flex: "0 0 auto", maxWidth: 160,
  },
  row: {
    display: "flex", alignItems: "center", flex: 1,
    gap: 36, flexWrap: "wrap",
  },
  cell: {
    font: "700 16px/1 var(--font-sans)",
    letterSpacing: "-0.01em",
    color: "var(--fg-muted)",
    opacity: 0.85,
  },
};

window.ProofBar = ProofBar;
