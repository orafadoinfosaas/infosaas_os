/* ProductGrid.jsx — 4 product cards with variant surfaces */
const PRODUCTS = [
  {
    id: "mvp",
    eyebrow: "Produto · 01",
    title: "Do Papel ao MVP, com construção ágil.",
    body: "Desenvolvimento acelerado de MVPs e automações com IA integrada, usando metodologia ágil e AI Assistants.",
    price: "A partir de R$ 15.000 / mês",
    surface: "light",
  },
  {
    id: "enterprise",
    eyebrow: "Produto · 02",
    title: "Soluções Enterprise sob medida.",
    body: "Full-custom com Next.js, React Native e Node. Performance, segurança e conformidade LGPD/GDPR feitas do jeito certo.",
    price: "A partir de R$ 20.000 / mês",
    surface: "dark",
  },
  {
    id: "suporte",
    eyebrow: "Produto · 03",
    title: "Suporte Personalizado Premium.",
    body: "Franquia mensal de horas (mínimo 20h) para manutenção e evolução contínua de projetos já lançados.",
    price: "A partir de R$ 8.000 / mês",
    surface: "light",
  },
  {
    id: "consultoria",
    eyebrow: "Produto · 04",
    title: "Consultoria Estratégica 1×1 com CEO + CMO.",
    body: "Até 90 dias de mentoria executiva: validação de mercado, modelagem de produto, design e MVP.",
    price: "A partir de R$ 20.000 / mês",
    surface: "accent",
  },
];

const ProductGrid = ({ onSelect, selectedId }) => (
  <section className="section" style={{ background: "var(--branco-off)" }}>
    <div className="container">
      <div style={pgStyles.head}>
        <div className="eyebrow">Produtos</div>
        <h2 className="display" style={pgStyles.h2}>
          Quatro formas de <span className="accent">pensar junto</span> com o seu negócio.
        </h2>
      </div>
      <div style={pgStyles.grid}>
        {PRODUCTS.map(p => (
          <ProductCard key={p.id} product={p}
            selected={selectedId === p.id}
            onClick={() => onSelect && onSelect(p.id)} />
        ))}
      </div>
    </div>
  </section>
);

const ProductCard = ({ product, selected, onClick }) => {
  const surface = product.surface;
  const isAccent = surface === "accent";
  const isDark = surface === "dark";
  const style = {
    ...pgStyles.card,
    background: isAccent ? "var(--laranja)" : isDark ? "var(--preto)" : "var(--branco)",
    color: (isAccent || isDark) ? "#fff" : "var(--preto)",
    borderColor: isAccent ? "var(--laranja)" : isDark ? "var(--preto)" : "var(--cinza-300)",
    boxShadow: selected ? "0 0 0 3px var(--laranja), var(--shadow-lg)" : "var(--shadow-sm)",
    transform: selected ? "translateY(-4px)" : "translateY(0)",
  };
  const arrowBg = isAccent ? "#fff" : isDark ? "var(--laranja)" : "var(--laranja)";
  const arrowColor = isAccent ? "var(--laranja)" : "#fff";
  return (
    <button onClick={onClick} style={style} aria-pressed={selected}>
      <div style={{...pgStyles.eyebrow, opacity: isDark || isAccent ? .7 : .55, color: "currentColor"}}>{product.eyebrow}</div>
      <div style={pgStyles.title}>{product.title}</div>
      <div style={pgStyles.body}>{product.body}</div>
      <div style={pgStyles.foot}>
        <div style={pgStyles.price}>{product.price}</div>
        <div style={{...pgStyles.arrow, background: arrowBg, color: arrowColor}}>→</div>
      </div>
    </button>
  );
};

const pgStyles = {
  head: { display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, marginBottom: 48 },
  h2: { fontSize: "clamp(36px, 4.4vw, 60px)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 },
  card: {
    appearance: "none",
    textAlign: "left",
    border: "1px solid var(--cinza-300)",
    borderRadius: "var(--radius-lg)",
    padding: 28,
    display: "flex", flexDirection: "column", gap: 14,
    minHeight: 260,
    transition: "transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)",
    cursor: "pointer",
    font: "inherit",
  },
  eyebrow: { font: "500 11px/1 var(--font-sans)", letterSpacing: ".14em", textTransform: "uppercase" },
  title: { font: "900 28px/1.05 var(--font-sans)", letterSpacing: "-0.02em" },
  body: { font: "400 15px/1.5 var(--font-sans)", opacity: 0.88, maxWidth: "44ch" },
  foot: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 12 },
  price: { font: "500 14px/1 var(--font-mono)" },
  arrow: {
    width: 42, height: 42, borderRadius: "999px",
    display: "grid", placeItems: "center",
    font: "700 18px/1 var(--font-sans)",
    transition: "transform var(--dur) var(--ease)",
  },
};

window.ProductGrid = ProductGrid;
