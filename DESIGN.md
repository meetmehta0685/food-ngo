---
name: Food Rescue Network
description: A vivid operational interface for moving surplus food through verified local handoffs.
colors:
  work-surface: "oklch(0.975 0.018 250)"
  ink: "oklch(0.205 0.04 255)"
  paper: "oklch(0.995 0.008 250)"
  signal-marigold: "oklch(0.68 0.17 67)"
  signal-marigold-foreground: "oklch(0.14 0.035 255)"
  warm-secondary: "oklch(0.92 0.04 250)"
  warm-secondary-foreground: "oklch(0.25 0.05 255)"
  quiet-surface: "oklch(0.94 0.027 250)"
  quiet-ink: "oklch(0.28 0.03 255)"
  attention-amber: "oklch(0.72 0.16 76)"
  attention-amber-foreground: "oklch(0.23 0.04 255)"
  urgent-red: "oklch(0.58 0.19 28)"
  paper-border: "oklch(0.86 0.04 250)"
  field-border: "oklch(0.81 0.05 250)"
  signal-ring: "oklch(0.55 0.16 67)"
  verified-mint: "oklch(0.52 0.15 160)"
  surface-container: "oklch(0.945 0.035 250)"
  meter-mint: "oklch(0.59 0.14 160)"
  meter-muted: "oklch(0.76 0.05 250)"
  meter-urgent: "oklch(0.58 0.19 28)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "0.625rem"
  md: "0.75rem"
  lg: "0.875rem"
  xl: "1.125rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-marigold}"
    textColor: "{colors.signal-marigold-foreground}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "1.75rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "1.75rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "1.75rem"
  status-chip:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.ink}"
    rounded: "999px"
    padding: "0.125rem 0.5rem"
  navigation-shell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.625rem 1rem"
---

# Design System: Food Rescue Network

## Overview

**Creative North Star: “The VU-Meter Bridge”**

Food Rescue Network treats surplus coordination as a live signal: food is reported, matched, dispatched, and verified across one readable chain. The interface uses a pale blue work-surface neutral as its desk, midnight ink typography as the control-room readout, and a marigold broadcast signal with mint verification that becomes amber or red only when attention is needed.

The system is operational rather than ornamental. Cards are quiet containers for decisions, mono labels provide telemetry, and the recurring meter motif gives realtime status a memorable visual language. The product avoids generic nonprofit gradients, decorative glow, and page-local palettes; every screen should feel like the same rescue desk.

**Key Characteristics:**

- Pale blue paper surfaces with grounded midnight ink.
- Marigold broadcast signal, mint verification, amber attention, red urgent state.
- Compact shadcn controls with Phosphor iconography.
- VU-meter telemetry as the signature visual, not decoration.

## Colors

The palette is a cool paper-and-ink system with a vivid marigold action signal. Semantic tokens are the only source for UI color; dark mode keeps the same roles while shifting the work surface into deep night-sky ink.

### Primary

- **Marigold Signal**: The broadcast action for primary decisions and the first step in a rescue.
- **Mint Verification**: The calm confirmation cue for accepted states and verified progress.
- **Attention Amber**: A warm attention cue for deadlines, illustrative finance readouts, and safe-window context.
- **Urgent Red**: Reserved for destructive actions, failed handoffs, and genuinely urgent states.

### Neutral

- **Work Surface**: The default application canvas and page background.
- **Paper**: Elevated cards, popovers, and focused content surfaces.
- **Quiet Surface**: Secondary panels, telemetry wells, and subdued control backgrounds.
- **Ink**: Default text and high-contrast headings.
- **Quiet Ink**: Helper copy, timestamps, and supporting metadata.
- **Paper Border**: Dividers, field boundaries, and low-contrast structural lines.

### Named Rules

**The Signal Rarity Rule.** Green is a live operational signal, not a blanket decoration; reserve amber and red for their meaning.

**The Token-Only Rule.** Product UI never introduces page-level hex, RGB, or ad-hoc color utilities. Extend the global semantic vocabulary instead.

## Typography

**Display Font:** Plus Jakarta Sans (with ui-sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with ui-sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace fallback)

**Character:** Plus Jakarta Sans makes the product humane and direct, with compact letterfit for a calm operations surface. JetBrains Mono turns statuses, IDs, timestamps, and meter labels into a quiet telemetry layer.

### Hierarchy

- **Display** (600, responsive 2.5rem–4.5rem, tight line-height): Hero promise and major surface statements.
- **Headline** (600, responsive 1.875rem–3rem): Page titles and section anchors.
- **Title** (600, 1.125rem): Card titles and focused work areas.
- **Body** (400, 0.875rem, 1.6 line-height): Explanations, descriptions, and form support copy.
- **Label** (500, 0.625rem, tracked uppercase): Status, telemetry, IDs, and compact metadata.

### Named Rules

**The Two-Register Rule.** Use Jakarta for human decisions and explanations; use JetBrains Mono for operational state, never for long-form reading.

## Layout

The application uses a centered max-width workbench with generous horizontal gutters and responsive grids that collapse into a single readable column. Public pages pair a strong left-side narrative with a right-side operational artifact at desktop widths, then stack the artifact directly beneath the primary action on mobile.

Use flex and grid with explicit gaps rather than margin-driven rhythm. Keep first-viewport actions visible, maintain a readable paragraph measure, and let complex workspaces use two-column layouts only when the secondary map or timeline remains useful beside the main task. Mobile surfaces should keep the primary action and the active signal above the fold where practical.

## Elevation & Depth

Depth is primarily tonal: pale blue paper cards sit on the work-surface canvas, with quiet borders and restrained ambient shadows. Shadows support navigation and focus but never become the visual identity. Borders clarify grouping; they do not create a dense dashboard grid.

### Named Rules

**The Desk-Depth Rule.** Use tonal layering first, a quiet border second, and a small shadow only when a surface needs separation from the workbench.

## Shapes

The shape language is gently rounded and compact. Cards and major panels use the medium radius, controls use the smaller radius, and status chips use a pill silhouette. Borders are semantic and low contrast at rest, with primary or destructive emphasis reserved for state.

## Components

### Buttons

- **Shape:** Compact gently rounded rectangle (0.625rem radius).
- **Primary:** Marigold Signal with readable midnight foreground, short labels, and Phosphor icons marked as inline-start or inline-end.
- **Hover / Focus:** Token-based tonal shift and the shared ring; no bespoke glow or hard-coded shadow.
- **Secondary / Ghost / Tertiary:** Outline keeps the paper surface visible; ghost is reserved for low-emphasis navigation and secondary actions.

### Chips

- **Style:** Compact pill with mono label, semantic background, and a border only when the state needs more separation.
- **State:** Use badges for urgency, live connection, role, channel, and verification states; keep copy short and scannable.

### Cards / Containers

- **Corner Style:** Medium radius with clipping only when media needs to meet the surface edge.
- **Background:** Paper for primary work, quiet surface for supporting telemetry, and primary-tinted surfaces for signal callouts.
- **Shadow Strategy:** Ambient low shadow at rest for shell surfaces; tonal layering for most content cards.
- **Border:** Semantic border token at rest, state token for active/urgent/error emphasis.
- **Internal Padding:** Compact 1rem base with 1.5rem for major section headers.

### Inputs / Fields

- **Style:** Tokenized paper/input surface, semantic border, compact radius, and shadcn Field composition.
- **Focus:** Shared ring and border token; keep invalid state explicit with `data-invalid` and `aria-invalid`.
- **Error / Disabled:** Use shadcn Alert or FieldError with destructive tokens; disabled controls reduce opacity without changing their semantic role.

### Navigation

- **Style:** Floating compact shell with paper background, subtle border, and mono utility line.
- **Default / Hover:** Quiet ink links become foreground on hover; primary action remains visible.
- **Mobile:** Sheet navigation preserves the same routes and includes a title and description for accessible context.

### VU-Meter Bridge

The signature component is a four-channel operational readout for surplus, matching, transit, and verified handover. Keep the channel labels mono, the meter surface quiet, the needle motion subtle, and the state copy more important than the animation. Respect reduced-motion preferences.

## Do's and Don'ts

### Do:

- **Do** use global semantic tokens for every product surface and state.
- **Do** compose forms from shadcn Field, FieldGroup, FieldError, and the appropriate control primitive.
- **Do** use Empty for zero states, Alert for errors and important callouts, Progress for measurable progress, and Badge for compact status.
- **Do** keep live, accepted, delivered, and verified states visually distinct and textually explicit.
- **Do** preserve keyboard focus, readable labels, reduced motion, and mobile stacking.

### Don't:

- **Don't** introduce gradients, glow-heavy effects, page-local palettes, or generic dark dashboard chrome.
- **Don't** use raw HTML controls where a shadcn primitive exists.
- **Don't** use Lucide, emoji, or mixed icon libraries; use Phosphor with the configured shadcn icon contract.
- **Don't** present illustrative impact numbers as verified operational facts.
- **Don't** use animation to communicate information that is not also available as text.
