/* Manifesto.jsx — inverted black manifesto block */
const Manifesto = () => {
  const values = [
    { n: "01", t: "Não negociamos com a mediocridade.", b: "Cada projeto carrega a mesma equipe sênior do início ao fim — sem rotatividade, sem perda de contexto." },
    { n: "02", t: "Liberdade com responsabilidade.", b: "O time decide como executa. Em troca, responde pelo resultado." },
    { n: "03", t: "Dividir para multiplicar.", b: "O que aprendemos com um cliente vira repertório para o próximo. Nada fica trancado em uma cabeça." },
    { n: "04", t: "Um cliente satisfeito vale mais que vinte insatisfeitos.", b: "Por isso o ticket começa em R$ 20k/mês. Foco em qualidade, não em volume." },
  ];
  return (
    <section style={mStyles.wrap}>
      <div className="container" style={mStyles.inner}>
        <div style={mStyles.intro}>
          <div className="eyebrow eyebrow-light">Manifesto</div>
          <h2 style={mStyles.headline}>
            Não somos uma <span style={{ color: "var(--laranja)" }}>software-house</span>.
            <br />Somos um studio que pensa junto.
          </h2>
          <p style={mStyles.lead}>
            Os quatro valores que carregamos para dentro de cada conversa, cada projeto e cada entrega.
          </p>
        </div>
        <ol style={mStyles.list}>
          {values.map(v => (
            <li key={v.n} style={mStyles.item}>
              <div style={mStyles.num}>{v.n}</div>
              <div>
                <div style={mStyles.itemT}>{v.t}</div>
                <div style={mStyles.itemB}>{v.b}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

const mStyles = {
  wrap: { background: "var(--preto)", color: "var(--branco-off)", padding: "120px 48px" },
  inner: { display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 72, alignItems: "start" },
  intro: { display: "flex", flexDirection: "column", gap: 22 },
  headline: { font: "900 clamp(36px, 3.4vw, 52px)/1.05 var(--font-sans)", letterSpacing: "-0.02em", margin: 0 },
  lead: { font: "400 17px/1.55 var(--font-sans)", color: "rgba(255,255,255,.7)", maxWidth: "36ch", margin: 0 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  item: {
    display: "grid", gridTemplateColumns: "72px 1fr", gap: 24,
    padding: "28px 0", borderTop: "1px solid rgba(255,255,255,.16)",
  },
  num: { font: "500 13px/1 var(--font-mono)", color: "var(--laranja)", paddingTop: 2 },
  itemT: { font: "700 22px/1.2 var(--font-sans)", letterSpacing: "-0.015em", marginBottom: 6 },
  itemB: { font: "400 15px/1.55 var(--font-sans)", color: "rgba(255,255,255,.7)", maxWidth: "52ch" },
};

window.Manifesto = Manifesto;
