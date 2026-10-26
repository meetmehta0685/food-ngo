---
name: Food Rescue Network
description: A rescue drawn as one kolam line, rice-flour dots on a laterite threshold and ash ink on a limewash sheet.
colors:
  kumkum: "oklch(0.52 0.19 27)"
  kumkum-foreground: "oklch(0.985 0.006 90)"
  turmeric: "oklch(0.78 0.15 80)"
  turmeric-foreground: "oklch(0.26 0.04 60)"
  turmeric-wash: "oklch(0.86 0.13 85)"
  leaf: "oklch(0.5 0.12 150)"
  leaf-foreground: "oklch(0.985 0.006 90)"
  danger: "oklch(0.5 0.2 25)"
  laterite: "oklch(0.3 0.058 38)"
  rice: "oklch(0.955 0.012 90)"
  laterite-ink: "oklch(0.965 0.012 85)"
  laterite-muted: "oklch(0.83 0.03 70)"
  limewash: "oklch(0.972 0.007 100)"
  sheet: "oklch(0.992 0.004 100)"
  plaster: "oklch(0.948 0.011 95)"
  plaster-soft: "oklch(0.945 0.009 95)"
  secondary-plaster: "oklch(0.93 0.012 95)"
  ash-ink: "oklch(0.23 0.014 60)"
  ash-muted: "oklch(0.45 0.016 60)"
  hairline: "oklch(0.87 0.012 90)"
  field-edge: "oklch(0.8 0.015 80)"
  night-threshold: "oklch(0.205 0.016 50)"
  night-sheet: "oklch(0.245 0.018 50)"
  night-ink: "oklch(0.945 0.012 90)"
  night-kumkum: "oklch(0.64 0.19 30)"
typography:
  display:
    fontFamily: "Eczar, Georgia, serif"
    fontSize: "2.9rem"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  display-lg:
    fontFamily: "Eczar, Georgia, serif"
    fontSize: "5.75rem"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Eczar, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Eczar, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-lead:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Mukta, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  figure:
    fontFamily: "Eczar, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "32px"
  row: "20px"
  section: "80px"
  section-sm: "112px"
components:
  button-primary:
    backgroundColor: "{colors.kumkum}"
    textColor: "{colors.kumkum-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ash-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.ash-ink}"
    textColor: "{colors.limewash}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ash-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.plaster-soft}"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ash-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "44px"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ash-ink}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    height: "24px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ash-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  toggle-on:
    backgroundColor: "{colors.ash-ink}"
    textColor: "{colors.limewash}"
    rounded: "{rounded.md}"
    height: "40px"
  threshold-band:
    backgroundColor: "{colors.laterite}"
    textColor: "{colors.laterite-ink}"
---

# Design System: Food Rescue Network

## Overview

**Creative North Star: "The Swept Threshold"**

Every rescue is drawn as one continuous kolam line threaded through a dot lattice: donor, nearest NGOs, the claiming partner, the volunteer, the verified handover. The public face is a swept laterite threshold with rice-flour dots and a line that draws itself; the working screens are the same line in ash ink on a calm limewash sheet, where each role sees exactly how far its food has travelled. The kolam is the only motif, and it is never ornament: it always plots real stages and real progress.

Working screens are dense but quiet. Records sit on hairline-ruled rows, not tiles; type does the hierarchy work (Eczar for headings and figures, Mukta for everything read or operated); colour is reserved for meaning. Three pigments carry state, kumkum red for action, turmeric for what is live, leaf green for what is verified, and nothing else competes with them. Depth is flat: hairlines, a plaster tone, and the dark threshold band are the only layering devices.

The system refuses the charity page (soft gradients, heart iconography as decoration, smiling stock) and the dashboard of identical cards.

**Key Characteristics:**
- One motif, the kolam line on a dot lattice, used only where it plots real progress.
- Two grounds: laterite threshold (landing hero, footer) and limewash sheet (all working screens), plus a dark "swept threshold" theme.
- Kumkum is the single action colour; turmeric = live; leaf = verified.
- Eczar display serif with Mukta UI sans, both with Devanagari coverage; tabular figures for times, distances, counts.
- Ruled rows and ledgers for records; one card shell per region at most.
- Flat, hairline-built surfaces with softly rounded (10–12px), square-shouldered controls.

## Colors

Earth-pigment palette: a dark laterite threshold, a warm limewash sheet, ash ink, and three vivid pigments that each mean one thing.

### Primary
- **Kumkum Red** (kumkum): the one action colour. Primary buttons, the focus ring and text caret, the active-nav underline, the kolam mark's line, inline icons that lead a record's metadata, and the full-bleed closing call-to-action band. In dark mode it lifts to night-kumkum.

### Secondary
- **Turmeric** (turmeric, with turmeric-wash as the softer accent/selection tint): marks what is live now. The current node of every kolam route (ringed dot), the live event in a status timeline, text selection.

### Tertiary
- **Leaf Green** (leaf): marks what is verified or delivered. The final dot of a completed timeline, the delivered count badge.

### Neutral
- **Laterite Threshold** (laterite): the dark swept ground for the landing hero, the threshold top-nav and the footer. Text on it is laterite-ink; secondary text laterite-muted.
- **Rice Flour** (rice): the dot lattice on the threshold, mixed at 26% over laterite.
- **Limewash** (limewash): page background for every working screen.
- **Sheet** (sheet): cards, inputs, select triggers, popovers; a shade lighter than limewash so fields read as paper laid on the wall.
- **Plaster** (plaster, plaster-soft, secondary-plaster): quiet fills for hover, muted panels, secondary buttons and tab lists.
- **Ash Ink** (ash-ink) and **Ash Muted** (ash-muted): body text and secondary text.
- **Hairline** (hairline) and **Field Edge** (field-edge): rules and dividers; input strokes.
- **Danger** (danger): destructive actions and error alerts only, usually as a tinted outline or 10% fill, not as a solid block.

### Named Rules
**The One Action Colour Rule.** Kumkum is the only colour an actionable control may be filled with. Secondary actions are ink outlines or ghost buttons; never a second accent.

**The Pigment Means Something Rule.** Turmeric only ever marks the live/current step; leaf only ever marks verified or delivered. Neither is used decoratively.

**The Shape Carries State Rule.** State is never hue alone: done is a filled dot, live is a ringed dot with a turmeric core, pending is a hollow ring at reduced opacity, and every node carries screen-reader text ("done", "in progress", "not yet").

## Typography

**Display Font:** Eczar (with Georgia, serif), weights 500–800
**Body Font:** Mukta (with system sans), weights 400–700
**Label/Mono Font:** ui-monospace / SF Mono / Menlo, only for code

**Character:** Eczar is a sharp, high-contrast Indic-rooted serif that gives headings and big figures a hand-cut, printed weight; Mukta is an open, plain humanist sans that stays legible on phones outdoors. Both load Latin and Devanagari subsets.

### Hierarchy
- **Display** (600, 2.9rem mobile → 4.5rem at sm → 5.75rem at lg, line-height 0.95, -0.03em): the landing hero headline only.
- **Headline** (600, 2.25rem → 3rem at sm, line-height 1.05, -0.02em): every page title via the shared page header, and landing section headings (the closing band steps up to 3.75rem at sm).
- **Section heading** (600, 1.5rem): in-page section titles and record titles in ruled lists ("Available missions", a food type in the inbox).
- **Title** (600, 1.25rem, line-height 1.25): card titles and subsection titles.
- **Figure** (Eczar 600, 2.25rem, tabular): ledger values such as meals donated; the pickup OTP is the same face at 3rem with wide 0.18em tracking for digit legibility.
- **Body** (400, 1rem, line-height 1.55): the root size; lead paragraphs under page titles run at 1.125rem with relaxed leading, capped near 42rem.
- **Label / UI** (600, 0.875rem): buttons, nav links, metadata rows; badges are 0.75rem semibold.

### Named Rules
**The Tabular Figures Rule.** Times, distances, counts and codes always set with tabular numerals (every `time` element and the tabular utility).

**The No Kicker Rule.** No eyebrow or kicker labels above headings, and no uppercase letter-spaced micro-labels. A heading stands on its own; context goes in the sentence beneath it.

## Layout

Working screens live in a single centred column, max 72rem (1152px), with 16px side gutters on phones and 32px from 640px up, 32px top padding growing to 48px. The landing and footer widen to 80rem (1280px) and run their grounds full-bleed. Landing sections breathe at 80px vertical, 112px from sm.

Two-column working layouts put the record list on the left (about 1.1–1.3fr) and one context card (map, route, mission) on the right (0.7–0.9fr, min 18–20rem), collapsing to one column below lg. Records are rows separated by hairlines with about 20px vertical padding, typically a three-part grid of thumbnail or icon, content, and actions. Summary numbers sit in a ruled ledger (top and bottom rules, vertical dividers between figures at sm), not in stat tiles.

Touch targets are 44px tall on phones and step down to 40px from sm. Body has a 320px minimum width.

## Elevation & Depth

Flat by default. Depth comes from ground changes (laterite threshold vs limewash vs sheet), hairline borders and the plaster tone, not from shadows. The working top nav is sticky with a translucent limewash and a light backdrop blur over a bottom hairline.

### Shadow Vocabulary
- **Popover lift** (Tailwind shadow-md plus a 1px ink ring at 10%): select, combobox and dropdown menus, which float over content.
- **Sheet drawer** (shadow-lg): the mobile navigation sheet.
- **Sign-in sheet** (`box-shadow: 0 24px 48px -28px color-mix(in oklch, var(--foreground) 35%, transparent)`): the single sign-in / sign-up card, a soft ambient drop that sets the form on the wall.

### Named Rules
**The Flat Sheet Rule.** Cards and rows on working screens carry no shadow. Lift is reserved for things that float (menus, drawers) and the lone auth card.

## Shapes

Gently rounded, square-shouldered rectangles: base radius 12px, with controls at 10px, small controls and focus outlines on links at 8px, and pills (fully round) only for badges. Imagery and maps are clipped to 8–12px corners. Rules are 1px hairlines; empty states use a dashed hairline border over the faint dot sheet. The one curved, freehand form in the system is the kolam line itself, with round caps and joins, threaded around lattice dots.

## Components

### Buttons
Confident, compact, ink-first.
- **Shape:** softly rounded rectangle (10px), 1px border always present (transparent on filled variants).
- **Primary:** kumkum fill with kumkum-foreground, semibold 0.875rem, 44px tall (40px at sm), 16px side padding; lg size is 48px with 1rem text.
- **Hover / Focus / Active:** primary dims to 88% on hover; focus is a 2px kumkum ring at 40% with 2px offset; active nudges down 1px. Trailing arrows slide 2px right on hover.
- **Outline:** 70% ink border; inverts to solid ink with limewash text on hover. On the threshold the border and text use laterite-ink and invert to laterite text.
- **Ghost:** 80% ink text, plaster-soft fill on hover; the standard secondary action (Decline next to Accept).
- **Destructive:** danger outline at 40% and danger text, filling solid only on hover.

### Chips / Badges
- **Style:** 24px pill, 0.75rem semibold, tabular. Outline (25% ink border) is the default status badge; secondary is a plaster fill; destructive is a 10% danger tint with danger text.
- **State:** delivered/verified badges switch to leaf fill.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** sheet on limewash.
- **Shadow Strategy:** none (see Flat Sheet Rule).
- **Border:** 1px hairline.
- **Internal Padding:** 20px (16px for the small size); card titles are Eczar 1.25rem.
- Used for one context region per screen (route map, mission route), never as a repeated grid.

### Inputs / Fields
- **Style:** sheet fill, 1px field-edge stroke, 10px radius, 44px tall (40px at sm), 1rem text dropping to 0.875rem at sm; caret is kumkum.
- **Focus:** border turns kumkum with a 2px kumkum ring at 25%; hover darkens the stroke to 40% ink.
- **Error / Disabled:** danger border with a 2px danger ring at 20%; disabled fades to 50%.
- Select triggers and input groups share this exact treatment.

### Toggles and Tabs
- **Toggle:** transparent at rest, plaster on hover; pressed state is solid ink with limewash text.
- **Tabs:** a plaster track (12px radius, 3px inset) with the active tab lifted to limewash; the line variant drops the track and shows a 2px ink underline.

### Navigation
- **Working nav:** sticky limewash bar with hairline; left, the kolam mark (rotates 8° on hover) with the Eczar wordmark and a small muted tagline; centre, role links in semibold 0.875rem muted ink, active link in full ink with a 2px kumkum underline that scales in from the left.
- **Threshold nav:** the same layout sitting on laterite, non-sticky, wider container.
- **Mobile:** links collapse into a right-side sheet (max 22rem) with full-width 1rem rows, chevrons, and the active row in kumkum.
- **Footer:** laterite band with the kolam mark, Eczar wordmark and muted links that brighten to laterite-ink on hover.

### Kolam Route (signature)
The system's single motif and its progress indicator. Stages sit as nodes 100 units apart on a dot lattice; each segment loops about 270° around a lattice dot and crosses itself, the knot a kolam line makes. A faint dotted guide (20% opacity) shows the whole path; the solid stroke covers only stages actually reached. Node states follow the Shape Carries State Rule. Variants: **hero** (larger lattice, bolder 5px stroke, vertical, on the threshold), **default** (horizontal from sm, vertical on phones, labels with detail lines), **compact** (status timelines and mission checklists, 0.875rem labels or labels hidden). On the landing hero it draws itself once (kolam-draw, 1.8s expo-out, nodes popping in on stagger); reduced motion removes the animation. The **kolam mark** logo is a five-dot, one-line miniature with the line in kumkum.

### Ruled Record Row
The working-screen record pattern (rescue inbox, mission offers, landing role paths): a top-ruled list where each item is a hairline-bottomed row, about 20px vertical padding, containing an optional 56px rounded thumbnail, a status badge with tabular time/distance, an Eczar 1.5rem title, muted metadata with kumkum leading icons, and right-aligned stacked actions (primary then ghost) that go side by side on phones.

### Ledger
Summary figures in a ruled strip: top and bottom hairlines, vertical dividers at sm, each figure an Eczar tabular 2.25rem value above a muted 0.875rem label.

## Do's and Don'ts

### Do:
- **Do** fill actions with kumkum only, and keep secondary actions as ink outline or ghost buttons.
- **Do** use turmeric for the live/current step and leaf for verified/delivered, and pair each with a distinct mark shape plus screen-reader text.
- **Do** draw a kolam route wherever a rescue's progress is shown, plotting the real current stage; leave the unreached path as the faint dotted guide.
- **Do** list records as hairline-ruled rows and summarise numbers in a ruled ledger.
- **Do** set times, distances, counts and codes in tabular figures.
- **Do** keep page titles on the shared page header (Eczar 2.25rem → 3rem) with one lead sentence beneath.
- **Do** keep controls 44px tall on phones, 40px from sm.

### Don't:
- **Don't** use the kolam or the dot lattice as decoration; the lattice ground appears only where a kolam is drawn or as the faint dot sheet behind empty states.
- **Don't** add a second accent colour or fill a secondary action with colour.
- **Don't** build card grids of identical tiles or nest a card inside a card; one card shell per context region.
- **Don't** put eyebrow or kicker labels above headings, or uppercase letter-spaced micro-labels anywhere.
- **Don't** use soft gradients, decorative heart imagery or shadows on working-screen cards and rows.
- **Don't** signal state by hue alone.
