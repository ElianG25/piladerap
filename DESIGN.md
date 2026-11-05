---
name: Pila de Ra'
description: Liga de freestyle de plazas en RD. Cartel de calle sobre cemento, con el marcador oficial de tinta montado encima.
colors:
  concrete: "#e1e1dc"
  concrete-2: "#d3d3cd"
  ink: "#101010"
  ink-2: "#1b1b19"
  ink-line: "#34342f"
  pila: "#fdee0e"
  pila-deep: "#e6d800"
  live: "#d42e12"
  paper: "#f2f2ee"
  muted: "#4b4b46"
  muted-ink: "#a6a69e"
typography:
  display:
    fontFamily: "Anton, Arial Narrow, Impact, sans-serif"
    fontSize: "clamp(2.75rem, 9vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Anton, Arial Narrow, Impact, sans-serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.025em"
rounded:
  none: "0px"
  board: "4px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.pila}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.ink-2}"
  button-pila:
    backgroundColor: "{colors.pila}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-pila-hover:
    backgroundColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.pila}"
  scoreboard:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.board}"
  hero-slab:
    backgroundColor: "{colors.pila}"
    textColor: "{colors.ink}"
    padding: "28px"
  status-badge-live:
    backgroundColor: "{colors.live}"
    textColor: "{colors.paper}"
    padding: "4px 8px"
  text-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "48px"
    padding: "0 12px"
---

# Design System: Pila de Ra'

## Overview

**Creative North Star: "La pared de la plaza"**

The site is a street poster pasted on the league's wall with the official scoreboard mounted on top. Ground is light concrete, type and rules are ink, and the one loud color is the yellow of the pila (the logo's yellow), used as a flat slab at page scale. The only imagery is real: YouTube thumbnails of the battles and playlist cover photos, loaded remotely and never filtered. The Anton lettering is the same lettering the video thumbnails use.

Density is medium and operational: phone-first, tap targets of 44-48px, big tabular numbers, and rules that are visible on the page (scoring card, tie rule, "provisional" notice). Surfaces are flat and hard-edged. Depth comes from the concrete / ink / yellow contrast between blocks, never from shadows.

**Key Characteristics:**
- Concrete ground, ink panels, one yellow slab per view.
- Anton uppercase for headlines and big numerals; Archivo for everything read.
- Square corners everywhere; the ink scoreboard panel alone carries a 4px radius.
- 2px ink rules separate content; thin ink-line (#34342f) rules separate rows inside ink panels.
- Zero shadows, zero gradients, zero blur.
- Status is carried by shape and text, color is secondary.

## Colors

A three-material palette (concrete, ink, pila yellow) with one signal red reserved for event day.

### Primary
- **Pila Yellow** ({colors.pila}): the hero slab, the leader row and top-rank numerals, active nav on ink, text on ink buttons, the "provisional" notice, selection color, and the refresh bar. Reads as a block of color, not as an accent line.
- **Pila Deep** ({colors.pila-deep}): declared in the theme as the darker yellow step; not used by the sampled components.

### Secondary
- **Event-Day Red** ({colors.live}): only the "Hoy" status badge (`en_vivo`) and form error messages. `en_vivo` means the event is happening today in the plaza; there is no live stream, so never label it as a broadcast.

### Neutral
- **Wall Concrete** ({colors.concrete}): page ground, scrollbar track.
- **Shadowed Concrete** ({colors.concrete-2}): skeleton blocks.
- **Street Ink** ({colors.ink}): text, 2px rules, scoreboard, header, bottom nav, modals, theme-color.
- **Ink Raised** ({colors.ink-2}): hover on ink surfaces, inputs inside the scoreboard.
- **Ink Line** ({colors.ink-line}): row dividers, borders inside ink panels.
- **Poster Paper** ({colors.paper}): text on ink, form field fill.
- **Muted Ink-on-Concrete** ({colors.muted}): secondary text on concrete.
- **Muted on Ink** ({colors.muted-ink}): secondary text, inactive nav, column heads on ink.

### Named Rules
**The Slab Rule.** Yellow is a full block (hero slab, notice bar, chip), never a thin accent, glow, or gradient. One slab per viewport.
**The Ink Pair Rule.** Text on yellow is ink; text on ink is paper or yellow; ink buttons carry yellow text. Never yellow text on concrete.
**The Red Is Today Rule.** Red appears only for event-day status and errors.

## Typography

**Display Font:** Anton (with Arial Narrow, Impact fallback), via next/font
**Body Font:** Archivo (with system-ui), via next/font

**Character:** Condensed poster lettering against a plain, sturdy grotesque. Anton is always uppercase, tight (line-height 0.92, +0.01em tracking, balanced wrapping).

### Hierarchy
- **Display** (400, clamp(2.75rem, 9vw, 5rem), 0.92): the hero headline (champion or next date).
- **Headline** (400, 2.25rem to 3rem, 0.92): section titles (Ranking, Últimas batallas), registration title up to 3.75rem.
- **Numerals** (Anton 400, 1.875rem to 3rem, tabular): rank positions, points, countdown, scoring values.
- **Title** (Archivo 700, 1rem, uppercase for names): MC aliases, battle titles.
- **Body** (Archivo 400 to 600, 1rem, 1.5): descriptions; prose capped with `max-w-prose`.
- **Label** (Archivo 700, 0.75-0.875rem, +0.025em, uppercase): buttons, status badges, chips, nav items. Small column heads in the scoreboard use 0.75rem 600, sentence case.

### Named Rules
**The Tabular Rule.** Every score, record, count, and countdown uses tabular numerals (`.num`).
**The Real Text Rule.** Labels are real information (column heads, statuses), never decorative overline text above headings.

## Layout

Single column on phones, container capped at 72rem (max-w-6xl) with 16px / 24px side padding and 24-32px vertical padding. Section gaps are 32px. Desktop home is a two-column grid (scoreboard 1.1fr, latest battles 1fr); hero is photo 1.3fr / slab 1fr from `lg`; ranking page is a 44rem table beside the scoring rules. Spacing in use: 4, 8, 12, 16, 20, 28, 32px (Tailwind steps). Navigation: sticky 64px ink bar on top (brand, desktop tabs with 4px yellow underline, notification bell); on phones a fixed 64px ink bottom bar with icon + label, active tab marked by a 4px yellow top bar, with safe-area padding. Sections change with a 22ms-class slide (24px, 0.22s) and swipe gestures. Breakpoint behavior: `md` (768px) swaps bottom nav for top tabs and enables the hero background video.

## Elevation & Depth

Flat. There are no box-shadows, gradients, or blur in the build. Hierarchy comes from material contrast (concrete, ink, yellow) and 2px ink borders. Modals sit on an ink scrim at 80-90% opacity.

### Named Rules
**The Flat Wall Rule.** Nothing floats. Separation is a rule or a change of material, never a shadow.

## Shapes

Hard-edged. Buttons, badges, chips, inputs, cards, thumbnails, and slabs have 0 radius. The scoreboard panel (`.board`) is 4px, as are skeleton blocks and the focus outline's corners. 2px ink borders frame the hero, scoring card, and fields; list rows are divided by 2px rules. Thumbnails are 16:9 crops anchored at 50% 20% so faces stay in frame.

## Components

### Buttons
- **Shape:** rectangular block, 48px min height, 20px horizontal padding, uppercase 14px bold, +0.025em.
- **Ink (primary on yellow or concrete):** ink fill, yellow text; hover ink-2.
- **Pila (primary on ink):** yellow fill, ink text; hover paper.
- **Outline (secondary):** 2px ink border; hover fills ink with yellow text.
- **Disabled:** 40% opacity, not-allowed cursor.
- **Focus:** 3px ink outline, 2px offset on light surfaces; 3px yellow outline inside `.board` / `.on-ink`.

### Scoreboard
The signature component. Ink panel with 4px radius; Anton 36-48px title, a yellow "provisional" notice block when results are pending, header row with 2px ink-line rules, rows divided by ink-line, min height 56px. Rank and points in Anton tabular 30px; the leader's rank, alias, and points are yellow. Chips: "Campeón" yellow fill, "Empate" / "Pendiente" outlined muted. Movement arrows: up yellow, down a light coral. Footer toggle "Ver los N MCs" in yellow. Search field (shown above 6 MCs): 2px ink-line border, ink-2 fill, border turns yellow on focus.

### Hero slab
Yellow block with a 2px ink border; photo (real final thumbnail, or the pila mark on ink if none) beside the slab. Slab holds the champion in Display, a lead line, definition rows, countdown tiles (ink tiles, yellow Anton numerals), capacity bar, actions, and a 2px-ruled footer line with the slogan and counts. The hero background video is a muted YouTube-nocookie iframe that mounts only at 768px+, with motion allowed, no data-saver, and a connection faster than 3g; it waits 2.5s after load, fades in over 1s, and unmounts when off-screen or the tab is hidden.

### Status badge
Rectangular, uppercase 12px bold. futura: 2px ink outline; anunciada: yellow; inscripciones: ink with yellow text; en_vivo ("Hoy"): red with paper text; finalizada: ink with paper text; oculta: 2px muted outline.

### Battle list
Rows divided by 2px ink rules; 7.5-9rem 16:9 thumbnail with ink 30% scrim and a yellow play glyph (60% scrim on hover), uppercase title, round and winner beneath.

### Inputs / Fields
48px min height, 2px ink border, paper fill, no radius; white fill on focus; disabled at 50% opacity. Progress bars are a 2px ink-bordered track with ink fill.

### Modals
Video modal and MC sheet sit on an ink scrim; ink panel, 44px yellow square close button, Anton titles, 2px outlined share buttons in paper. MC sheet is a bottom sheet on phones and a 28rem right drawer from `sm`. Entry is a 0.28-0.3s rise of 24-40px with an expo-out ease.

### Navigation
See Layout. Tab labels are bold; inactive is muted-ink, active is yellow.

### Motion
Ease `cubic-bezier(0.22, 1, 0.36, 1)`; 0.22s for section changes, 0.5s for the hero headline rise, 1.4s skeleton pulse to 55% opacity, 1s video fade. Framer Motion honors reduced-motion (`MotionConfig reducedMotion="user"`); smooth scroll and skeleton pulse are disabled under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** use yellow as a block with ink text, one slab per view.
- **Do** put the leader, champion, and totals in Anton tabular numerals.
- **Do** use 2px ink rules between content on concrete and ink-line rules inside ink panels.
- **Do** switch the focus ring to yellow on ink surfaces and keep it ink on light surfaces (3px, 2px offset).
- **Do** keep tap targets at 44px or more (buttons 48px).
- **Do** use only real photos (YouTube thumbnails, playlist covers) without filters; keep the crop anchored at 50% 20%.
- **Do** state rules and uncertainty in plain text (scoring rules, tie rule, provisional notice).

### Don't:
- **Don't** use shadows, gradients, glows, or blur; the build has none.
- **Don't** round corners beyond the 4px scoreboard panel.
- **Don't** add dark "esports arena" gold-on-black styling or metric-card grids.
- **Don't** use red for anything other than event-day status and errors.
- **Don't** label `en_vivo` as a live stream; it means event day.
- **Don't** put yellow text on concrete.
