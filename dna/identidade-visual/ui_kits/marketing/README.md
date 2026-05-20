# Marketing UI Kit — Infosaas®

A high-fidelity, interactive recreation of the Infosaas marketing surface. The studio doesn't ship a customer-facing app (the products are services), so the marketing site **is** the product UI — this kit covers the patterns you need to assemble landing pages, product pages, manifestos, and pitch decks.

## What's here

| File | Component |
|---|---|
| `index.html` | Live demo — assembles every component into a full page |
| `Header.jsx` | Sticky top nav with logo + links + CTA |
| `Hero.jsx` | Full-bleed orange hero with stacked Sora 800 display + decorative símbolo overlay |
| `ProofBar.jsx` | Horizontal client logo strip (G4, V4, Phlebo, …) |
| `ProductGrid.jsx` | 3-up product card grid (light / dark / accent surface variants) |
| `Manifesto.jsx` | Inverted black section with eyebrow + Sora-800 statements |
| `Testimonial.jsx` | Pull-quote with photo, on warm orange paper |
| `CTASection.jsx` | Closing CTA with eyebrow, headline and primary button |
| `Footer.jsx` | Inverted footer with white wordmark and link columns |

## Run it

Open `index.html` directly in the browser. Components are loaded with `<script type="text/babel">` against React 18 + Babel standalone. No build step.

## Conventions

- **Tokens come from `../../colors_and_type.css`** — every component reads CSS vars, never hard-coded hex.
- Components are intentionally small (60–120 lines) and cosmetic. They are not production-ready React; copy the markup, lift the styles.
- All copy is taken from the real DNA repository at <https://github.com/orafadoinfosaas/infosaas_os> — no invented testimonials or stats.
- Icons: arrows are inline `→` glyphs. Where UI icons are needed, swap in Lucide.

## Scope notes

- Forms, animation orchestration and accessibility specifics are omitted — these are visual recreations.
- The kit demonstrates the **marketing** surface. If/when an app product ships, add a `ui_kits/app/` sibling kit.
