# Design System Specification: The Kinetic Terminal

## 1. Overview & Creative North Star
**Creative North Star: "The Orchestrated Intelligence"**

This design system rejects the "flat dashboard" archetype in favor of a high-density, editorial-grade financial environment. It is designed to feel like a high-performance instrument—think of a Swiss watch movement or a modern cockpit—where data isn't just displayed; it is choreographed. 

To break the "template" look, we employ **Intentional Asymmetry**. Rather than a rigid 12-column grid, layouts should utilize "The Power Column"—a single, high-contrast data stream (often using `surface-container-highest`) juxtaposed against expansive, breathable workspaces (`surface-dim`). By overlapping elements—such as a floating AI prediction tooltip (`Electric Blue`) slightly breaking the bounds of a price chart—we create a sense of three-dimensional depth and real-time urgency.

---

## 2. Colors & Surface Logic

The palette is rooted in the depth of `Deep Navy` and `Slate Gray`, but its soul lies in its tonal hierarchy.

### Surface Hierarchy & Nesting
We do not use lines to separate ideas. We use **Tonal Nesting**.
- **Base Layer:** `surface` (#10131a) – The infinite void.
- **Sectioning:** `surface-container-low` (#191c22) – Used for large sidebar or background regions.
- **Module Base:** `surface-container` (#1d2026) – The standard "card" or container background.
- **Active/Hover:** `surface-container-high` (#272a31) – To denote focus.
- **Floating/Action:** `surface-container-highest` (#32353c) – For modals or pop-overs.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. If a module needs to stand out, place a `surface-container-low` element on a `surface` background. The transition is felt, not seen.

### Signature Textures & Glass
To move beyond a "standard" dark mode, use **Glassmorphism** for floating AI insights or LSTM prediction overlays. Use the `primary` color (#adc6ff) at 8% opacity with a `20px` backdrop-blur. Main CTAs should not be flat; apply a subtle linear gradient from `primary` to `primary_container` (#4d8eff) at a 135-degree angle to provide a metallic, high-performance sheen.

---

## 3. Typography: The Technical Editorial

The system pairs the architectural precision of **Space Grotesk** with the utilitarian clarity of **Inter**.

*   **Display & Headlines (Space Grotesk):** These are your "Statement" tiers. Use `display-lg` for portfolio totals and `headline-md` for market sectors. The wide apertures of Space Grotesk convey a modern, aggressive financial posture.
*   **Data & Body (Inter):** All tabular data, tickers, and LSTM prediction text must use Inter. For monospaced requirements (like trade IDs), use the `label-sm` scale.
*   **Hierarchy as Identity:** Use `on_surface_variant` (#c2c6d6) for labels to create a "dimmed" effect, allowing the `high-contrast accents` (Emerald/Ruby/Electric Blue) to pop with maximum retinal impact.

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through **Tonal Layering** rather than traditional structural skeletons.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` ticker bar sitting atop a `surface-container-low` dashboard creates a "carved out" look, suggesting the data is embedded into the interface.
*   **Ambient Shadows:** For floating elements (modals/tooltips), use an "Atmospheric Shadow." 
    *   *Spec:* `0px 24px 48px rgba(0, 0, 0, 0.4)`. The shadow must be tinted with the `background` color (#10131a) to ensure it feels like a natural occlusion of light.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a Ghost Border: `outline-variant` (#424754) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `md` (0.375rem) roundedness. No border.
*   **Secondary:** Ghost style. No fill, `outline` token at 20% opacity. On hover, transition to `surface-container-high`.
*   **Tertiary:** Text-only using `Electric Blue` for AI-related actions or `primary` for standard actions.

### Input Fields
*   **State:** Background should be `surface-container-lowest` (#0b0e14). 
*   **Focus:** No glow. Instead, change the background to `surface-container-highest` and add a 1px `primary` ghost border (20% opacity).

### Cards & Data Lists
*   **The Divider Ban:** Never use lines between list items. Use the **Spacing Scale `3` (0.6rem)** to create "Gutter Separation."
*   **Nesting:** Place a list of assets inside a `surface-container` module. Each list item remains transparent, but the *hover* state activates a `surface-container-high` background.

### Pro-Terminal Specifics: The "Ticker-Tape" & "Pulse"
*   **The LSTM Prediction Chip:** A `primary_container` background with a `30%` Electric Blue glow. 
*   **The Success/Loss Indicators:** Use `tertiary` (#4ae176) for gains and `error` (#ffb4ab) for losses. These should be paired with a `2px` vertical accent bar on the left side of the data cell to provide immediate scannability.

---

## 6. Do's and Don'ts

### Do
*   **Use Asymmetric Padding:** Use `spacing-8` on the left and `spacing-12` on the right of a main dashboard area to create an editorial flow.
*   **Leverage Tonal Transitions:** Use background shifts to guide the eye from the navigation to the workspace.
*   **Embrace the Dark:** Let the `surface` (#10131a) breathe. High-density data requires significant negative space to remain legible.

### Don't
*   **Don't use 1px solid lines:** This is the quickest way to make a pro-tool look like a generic template.
*   **Don't use pure white:** The brightest text should be `on_surface` (#e1e2eb). Pure white (#FFFFFF) causes eye strain in dark-mode financial terminals.
*   **Don't use standard "Drop Shadows":** Shadows must be wide, soft, and tinted. If it looks like a "box shadow," it's too heavy.

---

## 7. Tokens Reference

*   **Corner Radius:** High-performance elements use `md` (0.375rem). Interactive "pills" (chips) use `full`.
*   **Spacing Scale:** Derived from a 0.1rem base. Use `spacing-5` (1.1rem) for standard padding to ensure the "Technical Editorial" feel.
*   **Core Accents:** 
    *   **Gains:** `tertiary` (#4ae176)
    *   **Losses:** `error` (#ffb4ab)
    *   **AI/Predictions:** `primary_container` (#4d8eff)