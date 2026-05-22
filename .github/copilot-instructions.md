# EVT Tech Ltd — Copilot Project Instructions

## Company Overview
**EVT Tech Ltd** — former Volta Trucks engineers, now independent.
- **Business**: Volta Zero electric trucks for sale, lease & rental; automotive engineering consultancy; battery solutions
- **Location**: Horiba MIRA, Nuneaton, CV10 0TU
- **Website**: https://evttech.co.uk

## Project: Static HTML/CSS/JS Website
No framework, no build tool, no npm. Plain files served directly.

### File Structure
```
index.html          — Home / landing page
vehicles.html       — Volta Zero vehicle listings
engineering.html    — Automotive engineering services
battery.html        — Battery solutions (~3.5 MWhr stock)
brand-a-volt.html   — Brand colour variant: Volt
brand-b-steel.html  — Brand colour variant: Steel
brand-c-zero.html   — Brand colour variant: Zero
brand-d-volt-navy.html
brand-e-teal-navy.html
brand-f-gold-navy.html
brand-g-warm-charcoal.html
brand-h-hybrid.html
css/styles.css      — Single global stylesheet
js/main.js          — Single JS file
img/                — All images (slide-based naming: slideNN_imgNN.png)
```

## Tech Stack
- **HTML5** — semantic markup, ARIA attributes for accessibility
- **CSS** — custom properties (design tokens), no preprocessor
- **JavaScript** — vanilla ES5-compatible IIFE, no libraries

## Design System (CSS Custom Properties)
| Token | Value | Use |
|---|---|---|
| `--bg-dark` | `#050d1a` | Page background |
| `--bg-section` | `#0a1628` | Section backgrounds |
| `--bg-card` | `#112240` | Card backgrounds |
| `--bg-card-hover` | `#172e54` | Card hover state |
| `--accent` | `#FCD34D` | Primary accent (yellow/gold) |
| `--accent-light` | `#FEF08A` | Accent hover |
| `--accent-dark` | `#F59E0B` | Accent dark |
| `--text-primary` | `#E2E8F0` | Main text |
| `--text-secondary` | `#94A3B8` | Secondary text |
| `--text-muted` | `#64748B` | Muted/label text |
| `--border` | `#1a2f4a` | Default border |
| `--border-accent` | `rgba(252,211,77,0.3)` | Accent border |
| `--radius` | `12px` | Default border radius |
| `--transition` | `0.25s ease` | Default transition |
| `--font` | `'Inter'` | Google Fonts Inter |

**Theme**: Dark navy + yellow/gold accent throughout.

## JS Behaviour (main.js)
- Navbar scrolled-class on scroll (`#navbar` → `.scrolled`)
- Mobile hamburger nav toggle (`#navToggle` / `#navLinks`)
- Smooth scroll for `a[href^="#"]` links (80px navbar offset)
- IntersectionObserver scroll-in animations (`.anim` → `.visible`)
  - Targets: `.vehicle-card`, `.service-card`, `.why-item`, `.about-card`, `.parts-feature`, `.stat`, `.spec-item`

## Coding Conventions
- Use existing CSS custom properties — do not hardcode colours or sizes
- Keep JS in the existing IIFE (`main.js`); vanilla only, no jQuery/lodash
- Page-specific CSS goes in a `<style>` block in the `<head>` of that page
- All images go in `img/`; follow `slideNN_imgNN.png` naming if adding new
- Maintain semantic HTML and ARIA attributes
- Canonical URLs follow pattern: `https://evttech.co.uk/page.html`
