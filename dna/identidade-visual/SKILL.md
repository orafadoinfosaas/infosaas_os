---
name: infosaas-design
description: Use this skill to generate well-branded interfaces and assets for Infosaas®, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets and UI kit components for prototyping. Infosaas is a Brazilian premium studio (development + business strategy) with a tight one-orange palette and Sora typography.
user-invocable: true
---

# Infosaas Design Skill

Read `README.md` first — it contains the full brand fundamentals (voice, content, visual, iconography) plus an index of every file in this skill.

## Quick orientation
- **Palette:** `#FF3D00` (laranja) · `#000000` (preto) · `#F5F5F5` (branco off) · `#D9D9D9` (cinza claro). One accent, three neutrals. No additional brand colors.
- **Type:** Sora — body 16–18 / 1.55, headings 700, display 800 set tight with `letter-spacing: -0.02em`.
- **Wordmark:** lowercase `infosaas®`. Always with the ®.
- **Voice:** Portuguese (BR), *você*, direct, confident, no filler. Hard block-list of forbidden words is in `README.md` → Content Fundamentals. Words to use: *studio · parceiro · negócio · sensatez · clareza · resultado*.
- **Tokens & elements:** import `colors_and_type.css` and reuse its semantic CSS vars (`--bg`, `--fg`, `--accent`, `--radius-lg`, …).
- **Assets:** logos in `assets/logos/` (SVG + PNG, black / branco / laranja). Reference banner applications in `assets/banners/`.
- **Components:** `ui_kits/marketing/` contains React-style JSX components and a live `index.html` demo.

## When invoked

1. **Read** `README.md` end-to-end before designing.
2. **Decide the artifact**:
   - Marketing / slides / mocks → copy assets out, write a static HTML file, link `colors_and_type.css`.
   - Production code → copy assets and tokens into the codebase, mirror the rules in this skill.
3. **Pick the layout pattern** that matches the brief — most likely one of:
   - Full-bleed orange hero with white Sora 800 stacked over the símbolo.
   - Off-white document with black type and a single orange accent.
   - Inverted (black) hero with off-white type for footers / closers.
4. **Never** introduce new brand colors, switch typefaces, use emoji in product surfaces, or use any word from the block-list in `README.md`.
5. **If the user gives no brief**, ask what they want to build (slide deck? landing page? prototype? social post?), then ask 3–5 sharp questions about audience, length, tone variant (Descoberta / Relacionamento / Prontidão), and required assets.

## Reference repository

Source of truth for product-specific copy (objections, benefits, transformations) lives at
<https://github.com/orafadoinfosaas/infosaas_os> — read `dna/produtos/` before generating product-page or pitch-deck content.
