---
name: Nocturne Focus
colors:
  surface: '#161213'
  surface-dim: '#161213'
  surface-bright: '#3d3839'
  surface-container-lowest: '#110d0e'
  surface-container-low: '#1f1a1b'
  surface-container: '#231e1f'
  surface-container-high: '#2d292a'
  surface-container-highest: '#383335'
  on-surface: '#eae0e1'
  on-surface-variant: '#e1bec0'
  inverse-surface: '#eae0e1'
  inverse-on-surface: '#342f30'
  outline: '#a8898b'
  outline-variant: '#594042'
  surface-tint: '#ffb2b9'
  primary: '#ffb2b9'
  on-primary: '#67001f'
  primary-container: '#fb5573'
  on-primary-container: '#5b001a'
  inverse-primary: '#b51f44'
  secondary: '#d1c5b3'
  on-secondary: '#363023'
  secondary-container: '#4d4638'
  on-secondary-container: '#bfb4a2'
  tertiary: '#ddbfc5'
  on-tertiary: '#3f2b30'
  tertiary-container: '#a58a90'
  on-tertiary-container: '#38242a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdadc'
  primary-fixed-dim: '#ffb2b9'
  on-primary-fixed: '#400010'
  on-primary-fixed-variant: '#91002f'
  secondary-fixed: '#ede1ce'
  secondary-fixed-dim: '#d1c5b3'
  on-secondary-fixed: '#211b0f'
  on-secondary-fixed-variant: '#4d4638'
  tertiary-fixed: '#fbdbe1'
  tertiary-fixed-dim: '#ddbfc5'
  on-tertiary-fixed: '#28171b'
  on-tertiary-fixed-variant: '#574146'
  background: '#161213'
  on-background: '#eae0e1'
  surface-variant: '#383335'
  surface-base: '#131112'
  surface-elevated: '#1E1A1C'
  surface-overlay: '#262023'
  accent-mauve: '#8B5E63'
  border-subtle: rgba(255, 242, 223, 0.08)
  border-active: rgba(247, 82, 112, 0.4)
  text-muted: '#A89B9D'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  metric-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies a calm, high-precision productivity aesthetic inspired by elite craftsmanship tools like Linear, Things 3, and Notion. It merges dark-mode minimalism with tactile warmth, replacing harsh cold blacks with deep charcoal, subtle plum undertones, and glowing warm coral highlights.

The brand personality is disciplined, elegant, mindful, and intentional. Designed for ambitious professionals, knowledge workers, and builders tracking habits and deep work, it eliminates cognitive fatigue by prioritizing quiet background fields and razor-sharp typographic hierarchy. The emotional response evokes flow state, quiet confidence, and tactile delight upon completing micro-rituals.

## Colors

The palette operates in a deeply immersive dark mode anchored by warm charcoal-noir surfaces rather than dead black:
- **Primary (`#F75270`):** Energetic warm coral and watermelon pink. Used exclusively for primary calls to action, completion checkmarks, active streak highlights, and critical progress pulses.
- **Secondary (`#FFF2DF`):** Cream / warm vanilla. Delivers high contrast for primary headings, prominent numerical readouts, and inverted chip components without the glare of pure `#FFFFFF`.
- **Tertiary (`#2D1B20`):** Deep plum / burgundy. Serves as tinted container backdrops, segmented control backgrounds, and contextual pill fills that provide subtle chromatic warmth under coral accents.
- **Neutral (`#1A1617`):** Deep dark charcoal canvas. Establishes the foundational canvas layer, complemented by `surface-base` (`#131112`) for screen backgrounds and `surface-elevated` (`#1E1A1C`) for interactive cards.
- **Named Accents:** Includes `accent-mauve` (`#8B5E63`) for tertiary tags and muted states, along with hair-thin luminous warm vanilla border strokes (`rgba(255, 242, 223, 0.08)`).

## Typography

The type system implements a three-family structural cadence:
1. **Headlines (Plus Jakarta Sans):** Geometric, welcoming, and modern. Tighter letter spacing on display headers imparts a refined editorial executive feel.
2. **Body (Hanken Grotesk):** Highly legible, humanistic, and balanced. Used across notes, daily reflections, descriptions, and list item descriptions.
3. **Metrics & Labels (JetBrains Mono):** Monospaced precision for streak counts, completion timers, keyboard shortcut tooltips, and data timestamps. The tabular numerals prevent visual jitter during live countdowns.

## Layout & Spacing

This design system uses a rhythmic 4px/8px modular base scale combined with a fluid 12-column grid on desktop and a single/two-column adaptive layout on mobile.
- **Mobile (<768px):** Outer screen margin of `1rem`, compact gutters of `1rem`. Floating bottom action dock and thumb-friendly habit rows.
- **Tablet (768px - 1024px):** Outer margin of `2rem`, standard gutters of `1.25rem`. Two-column split for habit lists and detail/analytics panels.
- **Desktop (>1024px):** Max container width bounded at 1280px with margins of `3rem` and gutters of `1.5rem`. Enables persistent left navigation, central habit timeline, and right-hand telemetry stats.

## Elevation & Depth

Visual hierarchy uses tonal surface layering combined with precise perimeter micro-borders instead of heavy fuzzy drop shadows:
- **Surface Layering:**
  - Base canvas: `#131112`
  - Cards and list items: `#1E1A1C`
  - Popovers, elevated modals, and hover states: `#262023`
  - Recessed inputs and inactive containers: `#171315`
- **Ghost Outlines:** Every card and modal uses a crisp 1px stroke set to `rgba(255, 242, 223, 0.08)`. Hover or focused states transition to `rgba(247, 82, 112, 0.40)`.
- **Glow & Ambiance:** Interactive primary triggers and completed streak rings emit an ambient coral bloom (`box-shadow: 0 4px 20px -2px rgba(247, 82, 112, 0.25)`).

## Shapes

The interface embraces a unified soft geometry. Base elements (buttons, inputs, segmented tabs) adopt `0.5rem` (8px) corner radii. Structural cards and floating modules use `rounded-xl` (`1rem` / 16px) or `rounded-2xl` (`1.5rem` / 24px) to convey an inviting, tactile enclosure reminiscent of modern mobile and desktop software suites. Habit check triggers and floating icon controls retain complete pill or circular forms (`9999px`).

## Components

### Buttons
- **Primary:** Warm coral (`#F75270`) background with dark charcoal (`#1A1617`) or cream text in bold weight. Soft coral ambient blur on hover.
- **Secondary / Ghost:** Deep plum (`#2D1B20`) background with subtle vanilla border (`rgba(255, 242, 223, 0.08)`) and secondary text (`#FFF2DF`).
- **Inverted:** Warm vanilla (`#FFF2DF`) surface with dark charcoal text for high-impact milestones.
- **Outlined:** Transparent surface with 1px `border-subtle` and `#FFF2DF` typography.

### Habit Cards & Task Items
- Encased in `rounded-xl` containers using surface `#1E1A1C` with the signature `1px solid rgba(255, 242, 223, 0.08)` border.
- Includes trailing streak badges rendered in `JetBrains Mono` with coral flame indicators.
- Active completion trigger: An interactive pill/circle that transitions from a subtle mauve rim to solid coral fill with a clean check icon upon completion.

### Chips & Tags
- Compact `label-sm` font using JetBrains Mono.
- Tinted plum background (`#2D1B20`) or subdued mauve accent with rounded pill borders (`9999px`).

### Input Fields & Search Bars
- Recessed background (`#171315`), inset padding of `0.75rem 1rem`, 1px border.
- Placeholder text in muted taupe/mauve (`#A89B9D`), active focus reveals a glowing `#F75270` border highlight.

### Metrics & Streak Counters
- High-contrast numerical readouts set in `metric-lg` (`JetBrains Mono`).
- Paired with minimalist micro-bars showing daily consistency and completion heatmaps.