# Design Guidelines: Digital Book PDF Viewer

## Design Approach
**System Selected:** Fluent Design with Material Design influences - optimized for productivity tools with dark theme requirements and information-dense interfaces.

**Core Principle:** Prioritize readability, efficient navigation, and non-intrusive controls that keep focus on the PDF content while providing powerful highlighting tools.

---

## Layout System

### Grid Structure
- **Main Container:** Two-column layout with fixed sidebar (280px) and flexible content area
- **Sidebar:** Left-aligned, full-height panel containing all controls and metadata
- **PDF Viewer:** Centered canvas with maximum width constraints (900px) to maintain readability
- **Spacing Units:** Use Tailwind units of 2, 3, 4, 6, and 8 for consistent rhythm

### Responsive Breakpoints
- **Desktop (1024px+):** Sidebar visible, PDF centered at optimal reading width
- **Tablet (768px-1023px):** Collapsible sidebar, full-width PDF viewer
- **Mobile (<768px):** Bottom sheet controls, full-screen PDF optimized for touch

---

## Typography

### Font Families
- **Primary Interface:** Inter (400, 500, 600) - clean, modern sans-serif for UI controls
- **PDF Metadata:** JetBrains Mono (400) - monospace for page numbers and technical info

### Type Scale
- **Page Numbers:** 2xl weight-bold for current page, lg for total count
- **Section Headers:** lg weight-semibold with letter-spacing tight
- **Button Labels:** base weight-medium
- **Helper Text:** sm weight-normal with reduced opacity

---

## Component Library

### Sidebar Panel
- **Structure:** Divided into three sections with subtle dividers (1px, reduced opacity)
  - Navigation Zone (top): Page counter, previous/next buttons
  - Drawing Controls (middle): Mode toggle, color palette, clear button
  - Actions Zone (bottom): Export button, settings

### Navigation Controls
- **Page Counter Display:** Large centered numbers showing "Page X of Y" with prominent current page
- **Previous/Next Buttons:** Full-width rectangular buttons with clear icons (chevrons), height of 12 units
- **Spacing:** 4 units between buttons, 6 units separating from other sections

### Drawing Mode Controls
- **Mode Toggle:** Large switch-style button (height 10 units) with "Draw Mode: ON/OFF" label
- **Color Palette:** Grid of 6 color swatches (square buttons, 10 units each) in 2 rows
  - Active swatch: Thick border (3px) with scale transform (1.1x)
  - Hover state: Subtle scale (1.05x) with border preview
- **Clear Button:** Destructive action button with icon, full-width, height 10 units

### Action Buttons
- **Export Button:** Primary action button with download icon, full-width, height 10 units
- **Button Hierarchy:** 
  - Primary actions: Filled with prominent visual weight
  - Secondary actions: Outlined with transparent background
  - Destructive actions: Visual distinction through iconography

### PDF Canvas Area
- **Container:** Centered with shadow depth (lg) to elevate from background
- **Canvas:** Maintains PDF aspect ratio with max constraints
- **Page Turn Animation:** 400ms ease-in-out transform with slight scale effect (0.98x → 1.0x)
- **Highlight Overlays:** Semi-transparent rectangles (opacity 0.3) rendered above PDF layer

---

## Interaction Patterns

### Drawing Mode
- **Activation:** Single click toggle - immediate visual feedback with mode indicator
- **Drawing Interaction:** Click-drag to create rectangular highlight, snapping to text bounds
- **Visual Feedback:** Live preview rectangle while dragging with selected color at reduced opacity

### Highlight Management
- **Persistence:** Auto-save on creation - no manual save required
- **Clear Confirmation:** Immediate action with toast notification showing count cleared
- **Export:** One-click JSON download with timestamp in filename

### Page Navigation
- **Button Navigation:** Instant page change with animation
- **Keyboard Support:** Arrow keys for page navigation, Escape to exit draw mode
- **Touch Gestures:** Swipe left/right for page navigation on mobile

---

## Spatial Relationships

### Sidebar Spacing
- **Top padding:** 8 units
- **Section padding:** 6 units vertical, 4 units horizontal
- **Element spacing:** 3 units between related items, 6 units between sections

### Content Area
- **Canvas margins:** 8 units on all sides for desktop, 4 units for mobile
- **Highlight padding:** 1 unit internal spacing from text bounds
- **Shadow depth:** Layered shadows (sm for sidebar, lg for canvas) creating depth hierarchy

---

## Animations

### Essential Only
- **Page Transitions:** 400ms ease-in-out fade + subtle horizontal slide (20px)
- **Mode Toggle:** 200ms spring animation for switch position
- **Button Interactions:** 150ms ease for hover/active states
- **Highlight Creation:** Instant appearance, no animation (maintains focus on content)

---

## Accessibility
- **Keyboard Navigation:** Full keyboard control for all functions
- **Focus Indicators:** Prominent 2px outline with offset for all interactive elements
- **Touch Targets:** Minimum 44px height for all buttons and controls
- **Screen Reader Labels:** Descriptive ARIA labels for icon-only buttons
- **Contrast Ratios:** Maintain WCAG AA standards against dark background