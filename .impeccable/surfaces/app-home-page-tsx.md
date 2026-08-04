---
version: 1
slug: "app-home-page-tsx"
primary_target: "app/home/page.tsx"
related_targets: ["components/landing/public-landing.tsx","app/globals.css"]
---

# Home surface brief

## Purpose

Make the rescue network legible in the first viewport: a donor should know how to broadcast surplus, while NGOs and volunteers should recognize the shared realtime handoff model.

## Direction

Use the committed VU-meter bridge direction. The landing surface is a pale blue work surface with midnight ink, a marigold broadcast signal, mint verification cues, amber attention, and red only for urgent/destructive states. The visual metaphor is operational telemetry across a recording desk, not a generic charity campaign.

## Composition

- Top navigation stays compact and lets the primary broadcast action remain visible.
- The hero pairs a clear promise and two entry actions with a four-channel rescue signal bridge.
- The next section turns the promise into a donor broadcast workflow and keeps the form in a shadcn Card.
- Role pathways, the lifecycle, live activity, impact simulator, and contact support follow the same signal grammar.

## Constraints

- Use shadcn primitives for controls, fields, cards, badges, alerts, tabs/toggles, progress, and empty states.
- Keep product UI on semantic global tokens only; no page-level hex/RGB palette values.
- Use Phosphor icons and Base UI-compatible shadcn APIs.
- Maintain keyboard access, visible focus, reduced motion, and responsive behavior down to narrow mobile widths.

## Review checklist

- At 1440px, the hero message and signal bridge read as one composition without competing with the primary action.
- At 390px, the signal channels stack without horizontal overflow and the first action remains reachable.
- Forms expose labels, helper/error states, and no fabricated operational data is presented as verified.
