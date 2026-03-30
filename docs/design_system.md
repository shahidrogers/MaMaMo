# MaMaMo Design System

## Purpose
This design system defines the visual language for MaMaMo landing pages and study pages.

The target feel is:
- Bloomberg report
- Terminal-adjacent, but not fake-terminal chrome
- Dense, credible, analytical
- Dark, high-contrast, data-forward

## Typography
Do not change the typefaces currently in use.

- Sans: `Rubik`
- Mono: `IBM Plex Mono`

Usage:
- `Rubik` handles all body copy, headlines, and interface text.
- `IBM Plex Mono` is reserved for labels, metadata, stats, version chips, section markers, and technical values.

## Color Tokens
Core palette:

- `--bg: #05070a`
- `--bg-elevated: #0b0f14`
- `--bg-card: rgba(12,18,24,0.88)`
- `--border: rgba(115,146,175,0.18)`
- `--text: #d8dee8`
- `--text-muted: #7f8b99`
- `--accent: #f08a38`
- `--accent-dim: rgba(240,138,56,0.12)`
- `--red: #ff6b57`
- `--red-dim: rgba(255,107,87,0.12)`
- `--green: #67d38f`
- `--green-dim: rgba(103,211,143,0.12)`
- `--blue: #6ea4ff`
- `--blue-dim: rgba(110,164,255,0.12)`
- `--amber: #f5c15d`

Interpretation:
- Orange/amber is the primary system accent.
- Red is for losses, stress, inflation, and downside.
- Green is for windfalls, gains, and positive balances.
- Blue is for neutral analytical comparisons or secondary financial metrics.

## Background Treatment
Pages should sit on a layered dark field:

- Base near-black background
- Faint orange-to-blue horizontal atmospheric gradient
- Subtle full-page grid overlay
- Soft radial glows near the top corners

This should feel like a research terminal backdrop, not a gaming UI.

## Surfaces
Cards and panels should use:

- Low-radius corners: `2px`
- Thin cool border using `--border`
- Subtle top highlight gradient
- Soft inset highlight
- Deep shadow for separation

Rule:
- Prefer crisp, squared surfaces over rounded “app cards”.
- Avoid glassmorphism blur-heavy styling for primary content panels.

Variant surfaces:
- Base panel: `glass` / neutral card
- Warm panel: accent/orange-tinted
- Red panel: downside or stress
- Green panel: upside or windfall
- Blue panel: neutral comparison or macro context

## Section Headers
Section headers should follow the same pattern across pages:

- Mono
- Uppercase
- Tight size around `11px`
- Wide tracking
- Amber text
- Short accent rule before the label

This is the canonical section marker for report pages.

Example pattern:
- short horizontal line
- section label

## Dividers
Section dividers should be luminous but restrained:

- 1px rule
- Blue-to-orange-to-blue gradient
- Subtle glow band around the line

This divider replaces flat gray separators.

## Hero Style
Hero sections should be simple and editorial:

- Strong headline
- Muted explanatory paragraph
- Compact metadata pills
- No fake terminal top bars
- No decorative dashboard widgets unless the page genuinely needs them

The hero should read like the front page of an analysis note, not a software product landing page.

## Pills And Metadata
Use mono pills for:

- Versions
- Scenario tags
- Time horizons
- Model metadata
- GitHub or source links

Pills should be:

- Squared, not rounded capsules
- Border-defined
- Quiet by default
- Accent or status-colored only when meaningfully semantic

## Data Visualization Containers
Charts, tables, and timelines should live inside the same surface system as the rest of the page.

Rules:
- Keep plot containers dark and flat
- Prefer subtle borders over heavy frames
- Let color encode meaning, not decoration
- Use mono for numeric emphasis where possible

## Sidebar Pattern
When a page uses a sidebar:

- Sidebar background should match elevated page chrome
- Section group labels use mono uppercase amber styling
- Active links use the accent color and a left rule
- The sidebar should support deep reading, not feel like app navigation

## Spacing
General spacing rules:

- Large section rhythm: `48px+`
- Internal card padding: `16px` to `24px`
- Tight metadata spacing
- Generous headline spacing at the top of each page

The layout should feel deliberate and report-like, with fewer cramped UI clusters.

## Tone Rules For UI
The visual tone should communicate:

- research
- signal
- seriousness
- modern macro analysis

Avoid:

- playful gradients
- overly rounded consumer-app styling
- fake terminal window chrome
- noisy ornament
- bright saturated backgrounds

## Current Implementation Scope
This system currently applies to:

- `/Users/shahidrogers/Desktop/stagflation/index.html`
- `/Users/shahidrogers/Desktop/stagflation/studies/simulations/oil-200-iran-war/index.html`

Future pages should reuse these tokens and patterns rather than inventing new page-level aesthetics.
