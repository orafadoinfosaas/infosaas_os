/* Footer.jsx — inverted footer with brand block + columns */
const Footer = () => {
  const cols = [
    { h: "Studio",    items: ["Manifesto", "Time", "Posicionamento", "Carreiras"] },
    { h: "Produtos",  items: ["MVP ágil", "Enterprise", "Suporte Premium", "Consultoria"] },
    { h: "Mercados",  items: ["Educação", "Saúde", "Enterprise"] },
    { h: "Contato",   items: ["contato@infosaas.com", "São Paulo, BR", "Termos · LGPD"] },
  ];
  return (
    <footer style={fStyles.wrap}>
      <div className="container" style={fStyles.inner}>
        <div style={fStyles.brand}>
          <img src="../../assets/logos/logo-branco.svg" alt="infosaas" style={fStyles.logo} />
          <p style={fStyles.tag}>Um studio que pensa junto com o negócio — do início ao fim.</p>
          <div style={fStyles.stats}>
            <div><b style={fStyles.b}>10</b> anos</div>
            <div><b style={fStyles.b}>9.2</b> NPS</div>
            <div><b style={fStyles.b}>R$ 10M+</b> em projetos</div>
          </div>
        </div>
        <div style={fStyles.cols}>
          {cols.map(c => (
            <div key={c.h} style={fStyles.col}>
              <h5 style={fStyles.h}>{c.h}</h5>
              {c.items.map(i => <a key={i} href="#" style={fStyles.link} onClick={(e) => e.preventDefault()}>{i}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div style={fStyles.bottomBar}>
        <div className="container" style={fStyles.bottomInner}>
          <div>© 2026 Infosaas®. Todos os direitos reservados.</div>
          <div>CNPJ 00.000.000/0001-00</div>
        </div>
      </div>
    </footer>
  );
};

const fStyles = {
  wrap: { background: "var(--preto)", color: "var(--branco-off)" },
  inner: { display: "grid", gridTemplateColumns: "1.1fr 2fr", gap: 64, padding: "80px 48px 48px" },
  brand: { display: "flex", flexDirection: "column", gap: 22 },
  logo: { height: 32, display: "block" },
  tag: { font: "400 15px/1.55 var(--font-sans)", color: "rgba(255,255,255,.7)", maxWidth: "28ch", margin: 0 },
  stats: { display: "flex", gap: 24, marginTop: 8, font: "500 13px/1.2 var(--font-sans)", color: "rgba(255,255,255,.7)" },
  b: { font: "700 22px/1 var(--font-sans)", color: "#fff", display: "block", marginBottom: 4, letterSpacing: "-0.01em" },
  cols: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 },
  col: { display: "flex", flexDirection: "column", gap: 4 },
  h: { font: "500 11px/1 var(--font-sans)", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", margin: "0 0 14px 0" },
  link: { font: "500 14px/1.8 var(--font-sans)", color: "var(--branco-off)", textDecoration: "none" },
  bottomBar: { borderTop: "1px solid rgba(255,255,255,.16)" },
  bottomInner: { display: "flex", justifyContent: "space-between", padding: "20px 48px", font: "500 12px/1 var(--font-sans)", color: "rgba(255,255,255,.55)" },
};

window.Footer = Footer;
