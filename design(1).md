## name: Portal Akademik Tugas Akhir ISTTS
colors:
surface: '#f8f9ff'
surface-dim: '#cbdbf5'
surface-bright: '#f8f9ff'
surface-container-lowest: '#ffffff'
surface-container-low: '#eff4ff'
surface-container: '#e5eeff'
surface-container-high: '#dce9ff'
surface-container-highest: '#d3e4fe'
on-surface: '#0b1c30'
on-surface-variant: '#444650'
inverse-surface: '#213145'
inverse-on-surface: '#eaf1ff'
outline: '#757681'
outline-variant: '#c5c6d1'
surface-tint: '#465c9a'
primary: '#001645'
on-primary: '#ffffff'
primary-container: '#0f2a66'
on-primary-container: '#7e93d5'
inverse-primary: '#b3c5ff'
secondary: '#006398'
on-secondary: '#ffffff'
secondary-container: '#5bb8fe'
on-secondary-container: '#00476e'
tertiary: '#2b1300'
on-tertiary: '#ffffff'
tertiary-container: '#4a2400'
on-tertiary-container: '#df7c0f'
error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'
primary-fixed: '#dbe1ff'
primary-fixed-dim: '#b3c5ff'
on-primary-fixed: '#00184a'
on-primary-fixed-variant: '#2d4480'
secondary-fixed: '#cce5ff'
secondary-fixed-dim: '#93ccff'
on-secondary-fixed: '#001d31'
on-secondary-fixed-variant: '#004b73'
tertiary-fixed: '#ffdcc3'
tertiary-fixed-dim: '#ffb77d'
on-tertiary-fixed: '#2f1500'
on-tertiary-fixed-variant: '#6e3900'
background: '#f8f9ff'
on-background: '#0b1c30'
surface-variant: '#d3e4fe'
typography:
display-hero:
fontFamily: Manrope
fontSize: 32px
fontWeight: '700'
lineHeight: 40px
letterSpacing: -0.02em
headline-lg:
fontFamily: Manrope
fontSize: 24px
fontWeight: '700'
lineHeight: 32px
letterSpacing: -0.015em
headline-md:
fontFamily: Manrope
fontSize: 20px
fontWeight: '600'
lineHeight: 28px
letterSpacing: -0.01em
headline-sm:
fontFamily: Manrope
fontSize: 16px
fontWeight: '600'
lineHeight: 24px
letterSpacing: 0em
body-lg:
fontFamily: Public Sans
fontSize: 16px
fontWeight: '400'
lineHeight: 24px
letterSpacing: 0em
body-base:
fontFamily: Public Sans
fontSize: 14px
fontWeight: '400'
lineHeight: 20px
letterSpacing: 0em
body-medium:
fontFamily: Public Sans
fontSize: 14px
fontWeight: '500'
lineHeight: 20px
letterSpacing: 0em
body-semibold:
fontFamily: Public Sans
fontSize: 14px
fontWeight: '600'
lineHeight: 20px
letterSpacing: 0em
label-md:
fontFamily: Public Sans
fontSize: 12px
fontWeight: '600'
lineHeight: 16px
letterSpacing: 0.02em
label-sm:
fontFamily: Public Sans
fontSize: 11px
fontWeight: '500'
lineHeight: 14px
letterSpacing: 0.02em
code-meta:
fontFamily: Public Sans
fontSize: 12px
fontWeight: '400'
lineHeight: 16px
letterSpacing: 0.01em
rounded:
sm: 0.25rem
DEFAULT: 0.5rem
md: 0.75rem
lg: 1rem
xl: 1.5rem
full: 9999px
spacing:
gutter: 1.5rem
gutter-sm: 1rem
margin: 2rem
margin-sm: 1rem
space-2xs: 0.25rem
space-xs: 0.5rem
space-sm: 0.75rem
space-md: 1rem
space-lg: 1.5rem
space-xl: 2rem
space-2xl: 3rem

## Brand & Style

This design system establishes an elevated institutional visual language engineered specifically for the final project submission and evaluation portal at Institut Sains dan Teknologi Terpadu Surabaya (ISTTS). Tailored for the student (*Mahasiswa*) workflow, the interface translates high-stakes academic milestones into a clear, structured, and anxiety-reducing administrative experience.

### Brand Personality & Core Values

* **Academic Authority & Integrity:** Evokes institutional prestige, credibility, and rigor without unnecessary bureaucracy.

* **Precision & Clarity:** Every status, validation rule, and revision deadline is stated with unambiguous hierarchy to ensure full compliance with departmental guidelines.

* **Supportive Focus:** Alleviates the friction of multi-step document submissions through predictable layouts, deliberate whitespace, and clear contextual cues.

### Design Movement & Execution

The visual identity follows an elevated **Corporate Institutional** aesthetic with modern geometric precision:

* **Clean Structure:** Architectural lines, crisp borders, and balanced margins maintain order across data-dense panels.

* **Controlled Contrast:** A dominant deep navy foundation provides stability, supported by deliberate semantic status tokens for document states.

* **Restrained Polish:** Gentle radii and subtle ambient shadows deliver depth while retaining functional readability.

* **Formal Academic Copy:** All text and instructional labels use clear, polite, and standardized formal Bahasa Indonesia.

### Clean & Professional Visual Direction

Every screen must look calm, authoritative, and immediately actionable—prioritizing task completion over visual spectacle:

* **Clear Directional Flow (Where / What / Next):** Each view must answer three questions within 3 seconds of scanning: (1) *Where the student is* (clear page title and active nav indicator), (2) *What the current academic status is* (single prominent status badge and deadline banner if applicable), and (3) *What the next required action is* (one unmistakable primary CTA in `#0F2A66`).

* **One Primary Action Per View:** Every page or modular panel may contain at most **one** solid `#0F2A66` primary button. All secondary operations (cancel, download template, view history) must step down to secondary outline buttons (`#FFFFFF` with `#CBD5E1` border) or subtle text links (`#0284C7`).

* **Intentional Whitespace & Scannable Rhythm:** Use generous macro-spacing (`space-xl` / `32px`) between major page sections and tighter micro-spacing (`space-sm` to `space-md` / `12px–16px`) inside related form or metadata groups so hierarchy is obvious without heavy dividers.

* **Strict Left-Aligned Reading Axis:** Anchor page titles, section headers, form labels, and table text along a unified left vertical axis. Right-align numeric dates/sizes and row-level action buttons inside tables for rapid vertical scanning.

* **Zero Visual Noise:** Every border, badge, icon, and background tint must serve a functional role (grouping, state, or interaction). If a decorative element can be removed without losing clarity, remove it.

## Colors

The palette is anchored by the deep institutional navy `#0F2A66`, representing academic rigor, stability, and trust. Secondary sky tones and structured neutral surfaces balance this presence, creating a serene, highly legible work environment.

### Core Functional Roles

* **Primary Navy (`#0F2A66`):** Applied to active brand anchors, top app bars, primary actions, and primary section headers. An interactive hover variant steps to `#1A3B8B`.

* **Secondary Sky (`#0284C7`):** Powers active selection indicators, tab borders, interactive link states, and subtle focus glows.

* **Surface & Backgrounds:** The main page canvas sits at `#F8FAFC`, while cards and modular containers use `#FFFFFF` bordered by structural `#E2E8F0`. Soft tint variants `#F1F5F9` and `#E0F2FE` isolate auxiliary functional panels.

* **Warning & Deadline (`#D97706` / `#F59E0B`):** Reserved for revision alerts, deadline countdown warnings, and urgent validation notices.

### Academic Status Matrix

To preserve clarity throughout thesis evaluations, semantic color pairs consist of a high-contrast text/icon shade against an ultra-soft tint background:

* **Diterima / Tersedia (Approved):** Text/Icon `#15803D`, Container Surface `#DCFCE7`, Border `#86EFAC`.

* **Diperbaiki / Perlu Revisi (Needs Revision):** Text/Icon `#C2410C`, Container Surface `#FFEDD5`, Border `#FDBA74`.

* **Ditolak / Error (Rejected):** Text/Icon `#B91C1C`, Container Surface `#FEE2E2`, Border `#FCA5A5`.

* **Menunggu Verifikasi (Pending Review):** Text/Icon `#1D4ED8`, Container Surface `#EFF6FF`, Border `#BFDBFE`.

## Typography

The typographic hierarchy pairs the structured geometry of **Manrope** for primary headers with the neutral clarity of **Public Sans** for body and metadata.

### Typographic Roles

* **Headlines (Manrope):** Deliver confident institutional authority across portal landing views, modal titles, and section dividers. Tightened letter spacing preserves structural density.

* **Body & Administrative Elements (Public Sans):** Purpose-built for bureaucratic accuracy, ensuring that dense submission guidelines, feedback notes, and metadata strings remain legible under prolonged reading.

* **Status Badges & Form Labels:** Utilize `Public Sans SemiBold` with slight tracking expansions to differentiate administrative parameters from standard prose.

## Layout & Spacing

The portal is calibrated for a baseline desktop viewport of **1440px**, centered with a maximum structural canvas width of **1320px**. Layouts employ a standard 12-column grid to maintain clean margins between data tables, sidebar navigation, and multi-step dropzones.

### Spatial Distribution

* **Shell Dimensions:** The fixed primary header maintains a height of 72px, with an internal vertical clearance of 32px (`space-xl`) between the global bar and view titles.

* **Component Padding:** Standard cards utilize `space-xl` (2rem / 32px) on desktop and compress to `space-lg` (1.5rem / 24px) for compact data tables. Dropzone regions use `space-2xl` (3rem) vertical rhythm to draw natural visual focus.

* **Responsive Adaptations:**

  * **Desktop (≥1200px):** Full 12-column layout with fixed right-hand utility columns for deadlines and thesis progress.

  * **Tablet (768px – 1199px):** Columns collapse to 8; auxiliary sidebars convert into horizontally stacked cards.

  * **Mobile (<768px):** Single-column presentation with full-width action drawers and persistent bottom sticky status banners.

## Elevation & Depth

Depth is established through soft, multi-layered shadows tinted with cool navy slate (`rgba(15, 42, 102, ...)`), avoiding harsh neutral drop shadows. Surface layers stack logically to indicate interaction priority.

### Surface Tiers & Layering

1. **Base Canvas (Level 0):** Flat background color (`#F8FAFC`). No elevation.

2. **Standard Modular Cards (Level 1):** Main content cards sit at `0 1px 3px 0 rgba(15, 42, 102, 0.05), 0 1px 2px -1px rgba(15, 42, 102, 0.03)` with a solid `1px` border of `#E2E8F0`.

3. **Interactive & Hover Cards (Level 2):** Elevated interactive components and hover cards transition to `0 4px 6px -1px rgba(15, 42, 102, 0.07), 0 2px 4px -2px rgba(15, 42, 102, 0.05)` with an active border highlight.

4. **Floating Overlays & Popovers (Level 3):** User dropdowns, filter menus, and notifications elevate with `0 10px 15px -3px rgba(15, 42, 102, 0.08), 0 4px 6px -4px rgba(15, 42, 102, 0.04)`.

5. **Modals & Document Previews (Level 4):** Full review panels float above a 50% opacity slate-navy backdrop blur with `0 20px 25px -5px rgba(15, 42, 102, 0.12), 0 8px 10px -6px rgba(15, 42, 102, 0.06)`.

## Shapes

The interface balances institutional geometry with contemporary softness. A consistent rounding token of **0.5rem (8px)** to **0.75rem (12px)** is applied across actionable modules to soften technical workflows without losing administrative formality.

### Corner Radii Guidelines

* **Main Cards, Dialogs, Dropzones:** Standardized at `rounded-xl` (`0.75rem` / `12px`) to form structured, modern document frames.

* **Buttons, Form Inputs, & Select Triggers:** Standardized at `rounded-lg` (`0.5rem` / `8px`) for compact tactile targets.

* **Pill Badges & Counters:** Standardized at `rounded-full` (`9999px`) to maintain immediate visual distinction from square form elements and layout boxes.

## Components

### 1. Navigation Shell

* **Top App Bar:** Fixed at the top (`#FFFFFF`, border-bottom `1px solid #E2E8F0`, height `72px`).

  * **Left Section:** ISTTS academic crest accompanied by portal typography (*Portal Upload Tugas Akhir*).

  * **Center Links:** Horizontal list containing `Dashboard`, `Upload Proposal`, `Upload Revisi`, `Hasil Sidang Proposal`, `Download Proposal`, `Cari Proposal & TA`, and `Rekomendasi Judul`. Inactive items use `#475569`, while the active state uses primary navy text with an active bottom bar (`3px solid #0F2A66`).

  * **Right Section:** Notification bell icon featuring an amber counter badge (`#D97706`), paired with the Mahasiswa profile avatar (displaying student photo/initials, name, and NIM) with a caret toggling a dropdown menu containing `Ubah Profil` and `Keluar`.

* **Footer:** Clean administrative footer (`#FFFFFF`, border-top `1px solid #E2E8F0`, padding `24px 0`) featuring centered text: `© ISTTS - Departemen IT`.

### 2. Status Badges & Pill Indicators

* Rendered with `rounded-full`, padding `4px 12px`, typography `label-md`.

* **Approved / Diterima:** `bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]`.

* **Revision Required / Perlu Revisi:** `bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]`.

* **Rejected / Ditolak:** `bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]`.

* **In Review / Menunggu Verifikasi:** `bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]`.

### 3. File Upload Dropzone

* **Container:** Rounded `12px`, dashed border `2px solid #CBD5E1`, background `#F8FAFC`.

* **Drag-Over Active State:** Dashed border transitions to `#0284C7`, background transitions to `#F0F9FF`.

* **Visuals & Copy:** Centered upload icon, headline *Tarik & lepaskan file proposal di sini, atau klik untuk memilih file*, followed by meta hint *Format yang didukung: .PDF (Maksimal 20 MB)*.

* **File Selected State:** File item card with PDF document badge, formatted file name, size indicator, progress loader, and a destructive removal button (`Hapus File`).

### 4. Countdown & Alert Banners

* **Warning Banner (Deadline Approaching):** Border `1px solid #FDE68A`, background `#FFFBEB`, text `#92400E`, with clock icon and prominent text: *Batas Akhir Unggah Revisi Sidang Proposal: 3 Hari 14 Jam*.

* **Informational Banner:** Border `1px solid #BFDBFE`, background `#EFF6FF`, text `#1E40AF`, offering contextual submission notes.

### 5. Buttons & Form Fields

* **Primary Action Button:** Solid `#0F2A66`, text `#FFFFFF`, rounded `8px`, height `42px`, padding `0 20px`, font weight `600`. Hover state `#1A3B8B`. Focus ring `2px solid #0284C7` with offset.

* **Secondary Action Button:** Border `1px solid #CBD5E1`, background `#FFFFFF`, text `#1E293B`. Hover state `#F1F5F9`.

* **Input Fields & Select Boxes:** Height `42px`, background `#FFFFFF`, border `1px solid #CBD5E1`, rounded `8px`, padding `0 12px`, typography `body-base`. Placeholder color `#94A3B8`. Focus border `#0F2A66` with soft glow.

### 6. Academic Thesis Cards & Result Summary

* **Thesis Summary Card:** White canvas, `12px` border radius, `1px solid #E2E8F0`, subtle shadow. Houses thesis title, student name/NIM, assigned primary & secondary advisors (*Dosen Pembimbing*), current stage, and action links.

* **Evaluation Detail Table:** Alternating row tints (`#FFFFFF` and `#F8FAFC`), crisp headers (`#F1F5F9` background, `label-md` uppercase text), with right-aligned action buttons for downloading marked-up revision copies.

## Anti-Slop Restrictions (Copy & UI Guardrails)

To prevent generic AI-generated aesthetics and verbose filler copy, all screens and components must strictly adhere to the following negative constraints.

### 1. Copy & Microcopy Restrictions (Anti-Text Slop)

* **Zero Marketing or Motivational Fluff:** Never use SaaS welcome copy, cheerleading, or promotional phrasing (e.g., *"Selamat datang di perjalanan Tugas Akhir Anda!"*, *"Kelola proposal dengan mudah dan efisien"*, *"Siap melangkah ke tahap selanjutnya?"*, *"Pantau progres Anda secara real-time"*). Use direct, neutral administrative labels instead (e.g., *"Ringkasan Tugas Akhir"*, *"Status Pengajuan Proposal"*).

* **No Redundant Subtitles:** Do not add explanatory filler sentences beneath self-explanatory headings (e.g., do not place *"Halaman ini digunakan untuk mengunggah revisi proposal Anda"* under `Upload Revisi`). Helper text is permitted ONLY when stating a hard system rule, file constraint, or academic deadline.

* **No Emojis or Casual Punctuation:** Never use emojis (`🚀`, `✨`, `🎉`, `📄`, `⚠️`) in headings, badges, banners, buttons, or empty states. Avoid exclamation marks (`!`) across all UI copy, including success and warning messages.

* **Strict Formal Bahasa Indonesia:** Maintain consistent formal academic Indonesian for body copy, labels, and statuses (*Berkas*, *Batas Akhir*, *Dosen Pembimbing*, *Catatan Revisi*). Do not mix casual slang or unnecessary English buzzwords (retain English only for standardized navigation terms already defined in the Navigation Shell such as `Dashboard`, `Upload Proposal`, and `Download Proposal`).

* **No Generic Placeholders:** Never output `Lorem ipsum`, `John Doe`, `Jane Smith`, `Sample Title`, or `123456789`. All mock data must reflect realistic ISTTS academic formats (plausible Indonesian student names, structured NIM numbers, realistic engineering/computing thesis titles, and formal lecturer titles such as *Dr.*, *S.Kom.*, *M.Kom.*).

### 2. Visual & Layout Restrictions (Anti-UI Slop)

* **No Gradient Hero Banners or Glassmorphism:** Never generate full-width welcome hero cards, gradient headers, mesh backgrounds, decorative floating blobs, or `backdrop-blur` glass cards. Keep backgrounds flat (`#F8FAFC`) and containers solid white (`#FFFFFF`) with crisp `1px solid #E2E8F0` borders.

* **No Purple/Indigo AI Accents:** Strictly forbid off-palette purple, violet, indigo, or neon cyan accents. Primary interactions must use `#0F2A66` (hover `#1A3B8B`) and secondary focus/active accents `#0284C7`.

* **No Vanity KPI Grids or Decorative Charts:** Do not invent arbitrary metric cards (e.g., *"85% Kesiapan Sidang"*, *"Total Aktivitas"*, circular radial progress rings, or sparklines) unless backed by a real academic requirement. Represent thesis status using a clean linear milestone indicator or structured metadata table.

* **No Oversized Empty-State Illustrations:** Do not use cartoon, isometric, or 3D vector illustrations for empty states or upload areas. Pair a single monochrome outline icon (`24px–32px`, `#94A3B8`) with one factual sentence and, when applicable, one primary button.

* **No Unrequested Navigation Chrome:** Do not add floating AI chat widgets/FABs, dark-mode toggles, language switchers, sidebar collapses, or global search inputs inside the 72px Top App Bar. Strictly preserve the defined 7 center links, notification bell, and profile dropdown.

* **No Nested Cards (Card-in-Card Bloat):** Do not wrap individual table rows, metadata fields, or revision notes inside separate shadowed cards. Group related records inside a single Level 1 container separated by `1px solid #E2E8F0` horizontal dividers or alternating row tints (`#FFFFFF` / `#F8FAFC`).

* **Consistent Monochrome Iconography:** Use a single outline icon set (e.g., Lucide or Heroicons Outline, `1.5px` stroke) at uniform sizes (`16px` inside buttons/badges, `20px` in headers/banners). Never mix filled, duotone, and outline icon styles within the same view.

### 3. Quick Reference: Forbidden vs. Required

| Area | Forbidden ("Slop") | Required (ISTTS Standard) | 
| ----- | ----- | ----- | 
| **Page Header** | *"Halo, Budi! 👋 Semangat menyelesaikan Tugas Akhir Anda!"* | *"Dashboard Tugas Akhir"* + student NIM & stage metadata | 
| **Section Subtitle** | *"Lihat dan kelola seluruh riwayat revisi Anda dengan cepat di sini."* | *(Omit subtitle; let the section title and table headers speak)* | 
| **Empty State** | Large 3D illustration + *"Wah, belum ada dokumen nih! Yuk mulai unggah!"* | `28px` outline icon + *"Belum ada berkas proposal yang diunggah."* | 
| **Status Surface** | Full-bleed dark green/orange gradient card | White card with `rounded-full` semantic pill badge (`#DCFCE7` / `#15803D`) | 
| **Primary CTA** | *"Mulai Unggah Sekarang 🚀"* | *"Unggah Proposal"* | 
