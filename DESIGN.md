---
name: Contour
description: Agency Operations & Client Analytics Portal
colors:
  primary: "#C5F135"
  accent-hover: "#B8E620"
  neutral-bg: "#F4F4FA"
  surface: "#FFFFFF"
  ink: "#1A1A2E"
  ink-secondary: "#6B6B80"
  ink-muted: "#A0A0B0"
  border-light: "#ECECF4"
  sidebar-bg: "#1E1E2E"
  sidebar-foreground: "#FFFFFF"
  sidebar-accent: "#2A2A3D"
  sidebar-muted: "#A0A0B8"
  success: "#22c55e"
  success-subtle: "rgba(34, 197, 94, 0.08)"
  warning: "#f59e0b"
  warning-subtle: "rgba(245, 158, 11, 0.08)"
  error: "#ef4444"
  error-subtle: "rgba(239, 68, 68, 0.08)"
  trend-positive: "#4ADE80"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.5rem, 2vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.25rem, 1.5vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
    textTransform: "uppercase"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xxl}"
    padding: "28px"
  card-kpi:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.sidebar-bg}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 20px"
    border: "1px solid {colors.border-light}"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderBottom: "2px solid {colors.primary}"
  badge-status:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    rounded: "9999px"
    padding: "2px 10px"
---

# Design System: Contour

## 1. Overview

**Creative North Star: "The Command Center"**

Contour is a precision instrument for agency operators — a command center where every screen surfaces what matters and nothing else. The design feels like a physical control panel: deliberate, elevated, and quietly premium. Cards float on a soft lavender-white canvas (#F4F4FA), their generous radii (24px) and subtle shadows suggesting polished hardware rather than software defaults. The Signal Green accent (#C5F135) appears sparingly — a spotlight, not a wallpaper — drawing attention to active states, primary data, and moments that need the operator's eye.

This system explicitly rejects the generic SaaS playbook: no blue-and-white palettes, no glassmorphism, no gradient text, no dark mode on content surfaces. The dark navy sidebar (#1E1E2E) is the only dark surface, and its weight is balanced by the airy, card-based main canvas. Every visual decision serves clarity — typography is the primary UI element, not decorative effects.

**Key Characteristics:**
- Card-first architecture with 24px rounded corners and ambient shadows
- Lavender-white canvas with white floating cards — depth through elevation, not color
- Signal Green accent used as a precise highlighter, never as filler
- Inter font throughout — one family doing all the work via weight and size contrast
- Generous whitespace at every level — the interface breathes
- Consistent 8px spacing scale applied universally

## 2. Colors: The Signal Palette

A restrained dual-environment system: a dark, focused sidebar paired with a light, airy content canvas. Color is used functionally, not decoratively.

### Primary
- **Signal Green** (#C5F135): The single accent color. Used for active tab indicators, progress fills, health rings, interactive hover states, and key data highlights. Never used as a background fill for large surfaces.

### Neutral
- **Lavender-White Canvas** (#F4F4FA): Main page background. The soft tint keeps the white cards from feeling clinical while staying neutral enough to not influence perceived colors.
- **White Surface** (#FFFFFF): Card backgrounds, popovers, dropdowns, modals. The primary content container color.
- **Deep Ink** (#1A1A2E): Primary text. High-contrast body and heading color on white surfaces. Also the sidebar background.
- **Secondary Ink** (#6B6B80): Secondary text, muted labels, metadata. Meets WCAG AA on #FFFFFF.
- **Muted Ink** (#A0A0B0): Placeholder text, disabled states, secondary metadata.
- **Light Border** (#ECECF4): Card borders, dividers, table rows, input borders. A near-invisible structural element.

### Sidebar
- **Midnight Surface** (#1E1E2E): The dark navy sidebar background. The only dark surface — designed to recede and keep focus on content.
- **Sidebar Text** (#FFFFFF): Navigation labels, primary sidebar content.
- **Sidebar Accent** (#2A2A3D): Active/hover nav item backgrounds, sidebar dividers.
- **Sidebar Muted** (#A0A0B8): Secondary sidebar labels.

### Semantic
- **Success Green** (#22c55e): Positive trends, connected status, approved badges.
- **Warning Amber** (#f59e0b): Pending states, caution indicators, changes requested.
- **Error Red** (#ef4444): Rejection states, overdue indicators, destructive actions.
- **Trend Positive** (#4ADE80): Growth delta indicators in KPI cards.

### Named Rules

**The One Accent Rule.** Signal Green is used on ≤5% of any given screen. It highlights active navigation, completion states, and key data. If a screen has Signal Green on more than one element per viewport region, it's overused.

**The No-Blue Rule.** Generic blue links, blue buttons, and blue accents are prohibited. The primary interactive color is Signal Green or the sidebar's own dark tones. Blue is reserved exclusively for the Facebook social icon.

## 3. Typography

**Display / Body Font:** Inter (with system sans fallback)
**Mono Font:** SF Mono, Consolas, Liberation Mono

**Character:** Single-family typography where weight and size bear the entire hierarchy. Inter's neutral clarity at 15px body size makes long sessions comfortable; its tight tracking at display sizes gives headings presence without shouting.

### Hierarchy
- **Display** (700, clamp(24px–36px), 1.1, -0.02em): Page titles, client names. Used once per screen.
- **Headline** (700, clamp(20px–28px), 1.2, -0.01em): Section headers within cards ("Onboarding Progress", "Recent Activity").
- **Title** (600, 16px, 1.3): Card titles, dialog headings, list item titles.
- **Body** (400, 15px, 1.5): Primary reading text, table cells, descriptions, form labels. Cap line length at 65–75ch.
- **Label** (600, 12px, 1.3, 0.08em uppercase): Metric labels, section labels, metadata headers. The only uppercase style — use sparingly.

### Named Rules

**The Single-Family Rule.** Inter is the only font. No serif for display, no monospace for code. Contrast comes from weight and size, not font switching.

## 4. Elevation

The system uses soft ambient shadows to create a subtle card-on-canvas depth effect. Surfaces are flat at rest — shadow appears only to separate cards from the background, not to simulate z-height layers.

### Shadow Vocabulary
- **Card Shadow** (`0 2px 12px rgba(0,0,0,0.06)`): Default card state. Enough lift to separate from the canvas, not enough to feel floating.
- **Card Hover** (`0 4px 20px rgba(0,0,0,0.10)`): Hovered or focused card. A gentle rise.
- **Dropdown Shadow** (`0 8px 24px rgba(0,0,0,0.12)`): Menus, popovers, modals. The highest elevation.

### Named Rules

**The Flat-By-Default Rule.** Cards are flat at rest with a single ambient shadow. Shadows appear only as a response to hover or interactive state. No layered shadows, no multiple elevations within a single card.

## 5. Components

### Buttons
- **Shape:** Rounded at 12px (--radius-md). Pill-shaped for primary actions in the header.
- **Primary:** Dark surface background (#1E1E2E), white text, 10px horizontal 24px vertical padding. Hover shifts to near-black. Used for "Client Actions", "Save Note", and similar high-commitment actions.
- **Outline:** Transparent background, border at #ECECF4, ink text. Hover fills light gray. Used for "View Onboarding Details", "Edit Profile", "Manage Connections".
- **Ghost:** Transparent, secondary ink text. Hover shows subtle background. Used for tab actions, "Cancel", icon-only controls.

### Cards / Containers
- **Corner Style:** 24px radius for major section cards (onboarding, profile, social, activity, notes). 20px radius for KPI metric cards. 16px radius for smaller embedded containers.
- **Background:** White (#FFFFFF) on the lavender-white canvas (#F4F4FA).
- **Shadow Strategy:** Single ambient shadow at rest (--shadow-card). No border on most cards — the shadow alone defines the edge. When borders appear, they use #ECECF4.
- **Internal Padding:** 28px for major cards, 20px for KPI cards. Consistent per card type.

### KPI Metric Cards
- **Shape:** 20px radius, white background, border at #ECECF4, 20px padding, fixed 150px height.
- **Icon Container:** 36px circle with Signal Green-tinted background (#F2F8D7), centered icon in muted ink.
- **Composition:** Icon + label row (left), sparkline SVG (right). Below: 32px extrabold metric value, then trend delta with green up-arrow or red down-arrow.
- **Grid:** 4-column on large screens, collapses to 2 on tablet, 1 on mobile.

### Tabs (Sub-Navigation)
- **Style:** Borderless tab row. Active tab: ink text weight with a 2px Signal Green bottom border. Inactive: muted ink text, transparent border.
- **Spacing:** 16px horizontal padding per tab, 12px vertical with the border acting as the bottom edge.
- **States:** Hover shifts inactive text to ink. No background fill on any state.

### Badges / Pills
- **Status Badge:** Full-pill radius (9999px), 2px 10px padding. Success: green-tinged bg with green text. Warning: amber text with amber dot. Error: red text with red dot.
- **Active Status Capsule:** Full pill, green tint bg (#ECFDF5), green text (#10B981), 1px border (#D1FAE5). Used in client header.
- **Connection Status:** Inline green dot + "Connected" (or gray dot + "Inactive"), no background fill. Used in social connections list.

### Navigation (Sidebar)
- **Style:** Dark navy (#1E1E2E) full-height panel. Navigation items use rounded corners (#12px) with subtle hover fill (#2A2A3D). Active item uses Signal Green background with dark text.
- **Typography:** 14px semibold Inter for primary nav labels. 12px medium for section headers.
- **Icons:** 20px line icons in the sidebar, rendered in sidebar-foreground white, shifting to Signal Green on active.

### Inputs / Fields
- **Style:** Flat input with border at #ECECF4, white background, 12px radius. 15px body text for readability.
- **Focus:** Signal Green ring at `rgba(197, 241, 53, 0.4)` — a soft glow, not a harsh outline.
- **Textarea:** Same styling as inputs with 90px min-height for note entry.
- **Error:** Red border (#ef4444) with subtle error background.

### Stepper / Timeline
- **Style:** Horizontal progress line (2px) with 28px circular nodes. Completed nodes filled Signal Green with dark checkmark. Current node outlined Signal Green. Future nodes gray outline.
- **Labels:** 12px semibold text below each node. Completed labels in ink, current in Signal Green, future in muted ink.
- **Layout:** Flexbox with `justify-between` for equal spacing. Scrollable on mobile.

### Activity Feed Items
- **Style:** 36px circular icon container (light gray bg #F6F7FB) with muted icon. Content: 15px description text, 12px metadata below (actor name + date).
- **Badge:** Pill badge on the right — "Approved" in green (#EFEEFC / #16A34A), "Rejected" in red, "Changes" in amber.
- **Divider:** Bottom border at #ECECF4 between items.

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Green as a precise accent — active indicators, progress fills, completion states — never as a background fill for large sections.
- **Do** use the card-first pattern for all major content sections. Every related data group lives in a white card on the lavender canvas.
- **Do** use generous whitespace (28px card padding, 24px gap between cards). The interface should feel airy.
- **Do** let typography carry the hierarchy by weight and size. One font family (Inter) with clear size steps is the goal.
- **Do** use soft shadows for card elevation. The card shadow (0 2px 12px) is the only depth signal — no borders needed on most cards.
- **Do** use 24px rounded corners on major section cards — this is a signature detail.
- **Do** use the 8px spacing scale consistently across all components.
- **Do** show trends with green up-arrows and red down-arrows in KPI cards. Always include "vs last month" text.

### Don't:
- **Don't** use generic blue accents, blue links, or blue buttons. The primary accent is Signal Green.
- **Don't** use dark mode or terminal aesthetic on content surfaces. The dark navy sidebar is the only dark surface.
- **Don't** use glassmorphism, gradient text, or decorative effects.
- **Don't** nest cards — one level of card depth is the maximum.
- **Don't** use border-left greater than 1px as a colored accent stripe on cards or list items.
- **Don't** use numbered section markers (01, 02, 03) as default scaffolding.
- **Don't** use uppercase tracked eyebrows above every section — reserved for specific label contexts only.
- **Don't** use bounce or elastic easing for transitions. Use cubic-bezier(0.16, 1, 0.3, 1) for entrances.
- **Don't** create identical card grids with icon + heading + text repeated endlessly — vary the composition.
