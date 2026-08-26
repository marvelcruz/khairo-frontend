# KhairoDietClinic — Premium Website Design Brief (Stitch AI) · ELABORATED EDITION

**Prepared for:** Senior UI/UX Designer
**Project:** Marketing + lead-generation website for KhairoDietClinic — a medically supervised online weight-loss program for women
**Deliverable:** Multi-page, premium, advanced-animated, mobile-first responsive website
**Brand source of truth:** Attached "Did You Know? / Lac-Phe" graphic — magenta-on-black, halftone texture, bold condensed type, rounded speech bubble

> **How to read this brief:** Every section gives you (a) **purpose**, (b) **exact layout + measurements** (desktop 1440px canvas / mobile 375px canvas unless noted), (c) **ready-to-use copy** (placeholder data tagged `[PH]`), and (d) **motion notes**. Copy is final-draft quality — edit names/numbers tagged `[PH]` before launch.

---

## 1. Brand Foundation

KhairoDietClinic is a women-only, medically supervised weight-loss coaching brand. Voice = **science-backed, warm, empowering, anti-shame** (per the graphic's *"Movement is medicine — not a debt you pay for eating"*). Premium health-tech polish (Whoop / Oura / Future), never discount-flyer.

**Message pillars:** Medically supervised · Accountability & support community (women only) · Personalized meal plans · 700+ women helped · Biology-first education ("Lac-Phe", hunger neurons, hormones).

---

## 2. Design System (condensed — see original brief for full token table)

**Colors:** `--ink-black #0A0A0B` (bg) · `--charcoal #16161A` (cards) · `--magenta #EC008C` (primary) · `--magenta-deep #B80070` (hover) · `--blush #FF6FB5` (gradient start) · `--rose-tint #FFE3F1` · `--pure-white #FFFFFF` · `--off-white #F6F4F5` (light sections) · `--mist #B8B8C0` (muted text) · `--mint-signal #3BE0A0` (success/results) · `--gold-trust #E8C56A` (ratings/trust).
Gradients: magenta→blush, 135°. Glow shadows on dark (magenta @ 24% opacity, 40px blur), not grey.

**Type:** Display = **Clash Display** (hero = **Anton** option) · Subhead/UI = **Space Grotesk** · Body = **Inter** · Script accent = **Caveat** (single emphasized words only).
Scale (desktop / mobile): H1 80/40px · H2 52/32px · H3 30/24px · body-lg 19/17px · body 17/16px · caption 14/13px. Line-height 1.08 display / 1.6 body. Display tracking −2%.

**Shape/space:** 8px grid. Card radius 24px, button = full pill (radius 999px). Section padding 128px desktop / 64px mobile. Max content width 1200px, gutter 24px, 12-col grid.

**Signature motifs:** halftone-dot field + rounded speech-bubble (reused as testimonial / fact / FAQ cards).

---

## 3. Page-by-Page Specification (elaborated)

---

### 5.1 HOME

#### Section 1 — Hero
**Purpose:** Instant emotional hook + the anti-shame reframe + primary CTA.
**Layout (desktop):** Full-viewport (100vh, min 760px), dark `--ink-black`. Animated halftone-dot field across full canvas. Content left-aligned in a 7-col block starting col 1; right 5 cols hold a floating product/lifestyle image in a 24px-radius mask with magenta glow. Vertical centering. Navbar overlaid transparent (height 80px). A bottom trust-strip sits 48px above viewport bottom, full-width.
**Mobile:** Stacked, headline first, image below in 16:12 card, CTAs full-width stacked (56px tall, 12px gap), trust-strip as 2-line wrap.
**Spacing:** Headline → subhead 24px · subhead → CTA row 40px · CTA row → trust strip 64px.

**Copy:**
- Eyebrow (Space Grotesk, 14px, magenta, uppercase, +8% tracking): `MEDICALLY SUPERVISED · WOMEN ONLY`
- H1 (Clash/Anton, 80px): **Movement is medicine —**  *(line 2, with "not" in Caveat script magenta)* **not a debt you pay for eating.**
- Subhead (Inter, 19px, `--mist`): "A medically supervised weight-loss program built for women's biology — real meal plans, a private support community, and results that last. Over 700 women have already started."
- Primary CTA (magenta pill, 56px): **Start Your Journey →**
- Secondary CTA (ghost outline, 56px): **See How It Works**
- Trust strip (3 items, divider dots): `700+ women helped` · `Medically supervised` · `Private women-only community`

**Motion:** Halftone field parallax on scroll + subtle mouse-move drift (max 12px). H1 words stagger-fade-up (60ms stagger, 500ms each) on load. Slow magenta radial-glow pulse (8s loop) behind H1. Primary CTA magnetic + glow on hover.

---

#### Section 2 — Stat Band
**Purpose:** Immediate quantified credibility.
**Layout:** Full-width charcoal band, 200px tall desktop / auto mobile. 3 (or 4) stat columns, centered, divided by 1px `--magenta` @ 20% vertical rules. Each stat: big number (Clash, 64px, white) + label (Space Grotesk, 15px, `--mist`). Mint underline accent (4px, 48px wide) under each number.
**Mobile:** 2×2 grid, 32px gap.

**Copy:**
- **700+** — Women helped
- **[PH: 8.4kg]** — Avg. loss in program `[PH]`
- **[PH: 12]** — Week guided program `[PH]`
- **[PH: 94%]** — Complete the program `[PH]`

**Motion:** Numbers count up from 0 over 1.6s when 60% in view; mint underline draws left-to-right after count finishes.

---

#### Section 3 — The Anti-Shame Manifesto
**Purpose:** Empathy + differentiation from crash diets.
**Layout:** Light section (`--off-white`), 128px padding. Centered editorial column, max 760px. Oversized pull-quote with one magenta script word. Below: 2-col supporting paragraph (col gap 64px).
**Copy:**
- Pull-quote (Clash, 52px, `--ink-black`): "You don't need *another* punishing diet. You need a plan that works **with** your body."
- Body (Inter, 19px): "Most programs treat weight loss as restriction and willpower. We treat it as biology. Your hormones, your hunger signals, your metabolism — they're not the enemy. With medical supervision and a plan built around how women's bodies actually work, change stops feeling like a fight and starts feeling sustainable."

**Motion:** Quote fades + translates up 24px on enter; the script word draws in (handwriting reveal).

---

#### Section 4 — The KhairoDietClinic Method (4 pillars)
**Purpose:** Explain the offer as a system.
**Layout:** Dark section. Section header centered (eyebrow + H2 + 1-line intro, 64px below to grid). 4 cards in a row (desktop, 4-col, 24px gap, each 280px tall, charcoal, 24px radius); 2×2 on tablet; vertical stack mobile. Each card: magenta line-icon (48px) top, H3 title, 2-line body, hover lifts 8px with magenta glow.
**Copy:**
- Eyebrow: `THE KHAIRO METHOD`
- H2: **Four things working together. That's the difference.**
- Cards:
  1. **Medical Supervision** — "Your program is overseen by a health professional, not generic advice off the internet."
  2. **Personalized Meal Plans** — "Real food, built around your body, your goals, and your routine — no starvation, no fads."
  3. **Accountability Group** — "A private women-only community that keeps you consistent on the hard days."
  4. **Proven Results** — "Join 700+ women who've already changed their relationship with their bodies."

**Motion:** Cards stagger-reveal (80ms); icons draw-on (SVG stroke) on first view.

---

#### Section 5 — How It Works (scrollytelling)
**Purpose:** Reduce uncertainty about the process.
**Layout:** Sticky split. Left 5-col = pinned visual (phone mockup / illustration that swaps per step); right 7-col = 4 scrolling step blocks (each ~80vh). Step number in magenta (Clash, 96px, 12% opacity behind text). On mobile: vertical timeline with magenta connector line (2px) and node dots.
**Copy (steps):**
1. **Apply** — "Tell us about your goals in a 2-minute application. No pressure, no judgment."
2. **Assessment** — "A medically guided review of where you are and what your body needs."
3. **Your Plan + Your People** — "Get your personalized meal plan and join the private support group the same week."
4. **Track & Transform** — "Weekly check-ins, real adjustments, and a community cheering you on."

**Motion:** Pinned visual cross-fades/clip-wipes as each step scrolls into focus; active step text goes white, inactive `--mist`; magenta progress line fills down.

---

#### Section 6 — Did You Know / Science (brand-graphic motif)
**Purpose:** Biology-first authority; directly reuses the attached graphic's identity.
**Layout:** Dark, halftone-heavy. Large magenta **speech-bubble card** (recreating the graphic — rounded blob, white text) centered, max 720px, with the giant outline "?" marks at left as in the source. Below: small caption lines (white & mist). A horizontal dot-nav to cycle 3–4 facts.
**Copy (carousel):**
- Card 1 (reuse the graphic verbatim): "Did you know that exercise produces a molecule that biologically quiets your hunger neurons?" — *Caption:* "It's called Lac-Phe. It explains why movement suppresses appetite in a way restriction never can. Movement is medicine — not a debt you pay for eating."
- Card 2 `[PH]`: "Did you know muscle is metabolically active — it burns calories even while you sleep?"
- Card 3 `[PH]`: "Did you know sleep loss raises ghrelin, the hormone that makes you hungrier the next day?"

**Motion:** Bubble pop/scale-in with spring ease; "?" marks float subtly; fact swaps slide horizontally.

---

#### Section 7 — Results / Before & After
**Purpose:** Visual proof.
**Layout:** Light section. Header + 3-card row (desktop), each card = image pair (before/after split or slider) 4:5, name + stat below. Magenta "verified" tag, mint stat figure. Carousel on mobile (peek next card 16px).
**Copy:** Card label format — `[PH: "Chiamaka, lost 11kg in 14 weeks"]`. Section H2: **Real women. Real, lasting change.** Disclaimer caption (12px, mist): "Individual results vary. `[PH]`"

**Motion:** Clip-path wipe reveal on images; optional draggable before/after slider handle (magenta).

---

#### Section 8 — Testimonials
**Layout:** Dark. Speech-bubble cards (reuse motif), 3-up desktop slider / 1-up mobile. Each: gold 5-star row, quote (Inter 18px), avatar + name + tag. Auto-advance 6s, pausable.
**Copy `[PH — replace with real reviews]`:**
- ★★★★★ "I finally stopped seeing food as something to earn. Down 9kg and I actually feel free." — `[PH: Aisha O.]`
- ★★★★★ "The group is everything. On the days I wanted to quit, they showed up for me." — `[PH: Ngozi A.]`
- ★★★★☆ "Medically guided made all the difference — it felt safe, not extreme." — `[PH: Funke B.]`

**Motion:** Cards slide with momentum; active card scales 1.0, neighbors 0.94 + dimmed.

---

#### Section 9 — Meet Your Coach / Medical Credibility
**Purpose:** Substantiate "medically supervised."
**Layout:** Light section, 2-col. Left 5-col portrait (4:5, 24px radius, magenta glow). Right 7-col: name, credential line (gold), bio (2 paras), credential chips (pill tags). 
**Copy `[PH]`:** Name `[PH: Coach/Dr. ___]` · Credential `[PH: e.g. RN / Nutritionist / MBBS]` · Bio `[PH: 2 paragraphs on philosophy + the 700+ journey]`. Chips: `[PH: Medically trained]` `[PH: 700+ clients]` `Women's health focus`.

**Motion:** Portrait clip-reveal; chips stagger-pop.

---

#### Section 10 — Pricing / Programs
**Layout:** Dark. 3 tier cards (4-col block centered, middle card elevated +16px, magenta border + "MOST POPULAR" gold tab). Each: tier name, price, billing note, mint-check inclusion list, CTA pill. 
**Copy `[PH pricing]`:**
- **Core** — `[PH ₦]` — Meal plan + group access. 
- **Plus** (popular) — `[PH ₦]` — Everything in Core + weekly medical check-ins + adjustments.
- **VIP** — `[PH ₦]` — Everything in Plus + 1:1 coaching + priority support.
Inclusions use mint checkmarks; excluded use mist dash.

**Motion:** Popular card glows; hover raises card + intensifies glow.

---

#### Section 11 — FAQ
**Layout:** Light, centered 760px. Accordion items, speech-bubble styling on open, magenta +/− icon that rotates.
**Copy `[PH where noted]`:**
- "Is this safe / is it really medically supervised?" — "Yes. `[PH: explain oversight]`"
- "Do I have to exercise a lot?" — "No. Movement helps (remember Lac-Phe), but the plan is built around sustainable habits, not punishment."
- "Is it only for women?" — "Yes — the program and community are designed exclusively for women."
- "How do I get started / how do I pay?" — "Apply in 2 minutes, then we continue on WhatsApp. `[PH: payment]`"
- "What if I've failed every diet before?" — "That's exactly who this is for."

**Motion:** Smooth height expand (320ms); icon rotate 45°.

---

#### Section 12 — Final CTA Band
**Layout:** Full-width magenta→blush gradient (135°), 360px tall, halftone overlay @ 8% white. Centered: H2 white + 1-line + large white/ink pill CTA + WhatsApp secondary.
**Copy:**
- H2 (Clash, 56px, white): **Your last "first day" starts here.**
- Sub: "Join 700+ women who stopped dieting and started living."
- CTA: **Start Your Journey →** · secondary **Chat on WhatsApp**

**Motion:** Gradient slowly shifts hue position (12s); CTA magnetic.

---

#### Section 13 — Footer
**Layout:** Dark, halftone, 3-col + brand block. Giant KhairoDietClinic wordmark (Clash, 120px, 6% white outline as texture). Columns: Explore / Program / Connect. Newsletter inline field + magenta submit. Bottom bar: phone `+234 906 138 2720`, IG, FB, © + legal links.
**Motion:** Wordmark parallax drift; link hover = magenta slide-underline.

**Persistent:** Floating WhatsApp FAB (bottom-right, 64px, magenta, pulse ring). Mobile sticky bottom bar: **Apply Now** (full-width magenta, 56px).

---

### 5.2 THE PROGRAM (detail page)
**Layout:** Hero (compact, 60vh) → sticky left sub-nav (5 anchors) + right content column. Sections: What's included · Week-by-week structure (timeline, magenta nodes) · How it's different (comparison table — KhairoDietClinic vs typical diet, mint vs mist checks) · Who it's for / not for (2-col) · Expectations · Pricing recap → Apply CTA.
**Copy highlights:** Comparison table rows `[PH]`: Medical oversight ✓/✗ · Personalized meal plan ✓/generic · Community ✓/✗ · Sustainable approach ✓/restriction. Week-by-week `[PH: 12-week outline]`.

### 5.3 RESULTS / SUCCESS STORIES
**Layout:** Filter bar (All / `[PH: by goal]`) → masonry transformation grid → featured long-form story cards (image left, story right, alternating) → aggregate stat band → CTA. All imagery clip-reveal. Content `[PH]`.

### 5.4 PRICING / APPLY
**Layout:** Tier cards (as Home §10, expanded with full inclusion matrix) → **multi-step application form**: Step 1 Goal (chips) · Step 2 Current stats `[PH fields]` · Step 3 Contact + WhatsApp handoff. Animated progress bar (magenta fill), step transitions slide. Confirmation screen → WhatsApp deep-link button. Trust line: "Your information is private and never shared."

### 5.5 SCIENCE / "THE LAB" (blog)
**Layout:** Hero with featured article (large) + 2 secondary. Below: 3-col article card grid, category filter pills, load-more. Article template: 720px reading column, magenta progress reading-bar at top, pull-quotes in speech-bubble style, related articles footer. **SEO purpose: fixes the brand's current zero search visibility.** Seed topics `[PH]`: Lac-Phe & appetite · Hormones and women's weight · Why restriction backfires · Sleep & hunger.

### 5.6 ABOUT
**Layout:** Mission hero → origin story (editorial) → values (3 icon cards) → team/credentials → 700+ community stat → CTA. Copy `[PH]` for story/team.

### 5.7 CONTACT
**Layout:** 2-col — left: WhatsApp click-to-chat (primary magenta block), phone `+234 906 138 2720`, IG/FB; right: short contact form (name, email, message). Map/hours omitted (online business). FAQ shortcut link.

### 5.8 LEGAL
Privacy Policy · Terms · **Medical Disclaimer** (required given medical-supervision claims). Simple 720px reading layout.

---

## 4. Motion System (global rules)
Easing `cubic-bezier(0.22,1,0.36,1)`; durations 200–600ms. Scroll-reveal stagger 60–80ms. Count-ups on stats. Sticky scrollytelling on How It Works + Program. Magnetic CTAs. Clip-path image reveals. Speech-bubble spring pops. Page transitions fade/slide. **Honor `prefers-reduced-motion`** — kill parallax/large transforms, keep opacity fades only.

## 5. Responsive & Accessibility
Mobile-first (375px up). Touch targets ≥44px. Sticky mobile CTA + WhatsApp FAB always reachable. WCAG AA contrast (no small magenta-on-black body text). Keyboard nav, magenta focus rings, semantic headings, alt text.

## 6. Layout Uniqueness Directives
Asymmetric/broken-grid editorial layouts · overlapping speech-bubble cards · diagonal section breaks · recurring halftone + speech-bubble motifs on every page · oversized condensed type with single Caveat-script accent words · dark-dominant with light-section alternation for rhythm · glow elevation (no grey shadows) · magenta→blush gradient reserved for Hero + Final CTA only.

## 7. Deliverables from Stitch
Desktop + mobile frames for all 8 page types · full component library (buttons w/ all states, cards, nav, multi-step form, accordion, speech-bubble, stat band, pricing tier) · animated hero spec · color/type tokens as defined · interactive prototype demonstrating hero, scrollytelling, count-ups, and form flow.

---

*All `[PH]` items (pricing, coach name/credentials, real testimonials, exact stats, transformation imagery, week-by-week outline) must be supplied by KhairoDietClinic before launch. Site is structured for a WhatsApp-first conversion flow (matching the existing sales channel) with the Science/Lab hub addressing current search-visibility gaps.*
