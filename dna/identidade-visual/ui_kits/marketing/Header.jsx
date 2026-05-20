/* Header.jsx — sticky top navigation */
const Header = ({ activeRoute, onNavigate, onCTA }) => {
  const links = [
    { id: "studio",   label: "Studio" },
    { id: "produtos", label: "Produtos" },
    { id: "cases",    label: "Cases" },
    { id: "manifesto",label: "Manifesto" },
  ];
  return (
    <header style={headerStyles.bar}>
      <div style={headerStyles.inner}>
        <a href="#" role="link" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate("home"); }} style={headerStyles.lockup} aria-label="Início">
          <img src="../../assets/logos/logo-laranja.svg" alt="infosaas" style={{ height: 26, display: "block" }} />
        </a>
        <nav style={headerStyles.links}>
          {links.map(l => (
            <a key={l.id} href="#" role="link"
               onClick={(e) => { e.preventDefault(); onNavigate && onNavigate(l.id); }}
               style={{
                 ...headerStyles.link,
                 color: activeRoute === l.id ? "var(--laranja)" : "var(--preto)",
                 fontWeight: activeRoute === l.id ? 600 : 500,
               }}>{l.label}</a>
          ))}
        </nav>
        <button className="btn btn-primary" onClick={onCTA}>
          Fale com a gente <span className="btn-arrow">→</span>
        </button>
      </div>
    </header>
  );
};

const headerStyles = {
  bar: {
    position: "sticky", top: 0, zIndex: 50,
    background: "var(--branco)",
    borderBottom: "1px solid var(--cinza-300)",
  },
  inner: {
    maxWidth: 1240, margin: "0 auto",
    padding: "14px 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 24,
  },
  lockup: { display: "inline-flex", alignItems: "center" },
  links: { display: "flex", gap: 28, alignItems: "center" },
  link: {
    font: "500 14px/1 var(--font-sans)",
    textDecoration: "none",
    transition: "color var(--dur) var(--ease)",
  },
};

window.Header = Header;
