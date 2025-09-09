# WowDash Read-Only Template Reference Catalogue

This document provides a complete catalogue of the default routes, views, and UI components from the WowDash boilerplate template. All future work must adhere to this baseline to maintain consistency and leverage existing structure. This serves as the reference for integration with adapters, Supabase auth, and external platforms.

## 1. Default Routes

The routing is handled by Express.js in the `routes/` directory. The main router in `routes.js` mounts sub-routers and defines top-level routes. Key routes include:

### Top-Level Routes (from routes.js)
- `/` or `/index` → Renders "index" view (AI Dashboard, title: "Dashboard", subTitle: "AI")
- `/blankpage` → "blankpage" view (Blank Page)
- `/calendar` → "calendar" view (Components / Calendar)
- `/chat` → "chat" view (Chat)
- `/chat-profile` → "chatProfile" view (Dashboard subTitle)
- `/comingsoon` → "comingsoon" view (uses layout2)
- `/email` → "email" view (Components / Email)
- `/faqs` → "faqs" view (Faq)
- `/gallery` → "gallery" view (Gallery)
- `/kanban` → "kanban" view (Kanban)
- `/maintenance` → "maintenance" view (uses layout2)
- `/not-found` → "notFound" view (404)
- `/pricing` → "pricing" view (Pricing)
- `/stared` → "stared" view (Dashboard subTitle)
- `/terms-and-conditions` → "termsAndConditions" view (Terms & Conditions)
- `/testimonials` → "testimonials" view (Testimonials)
- `/view-details` → "viewDetails" view (Dashboard subTitle)
- `/widgets` → "widgets" view (Widgets)

### Sub-Routes (Mounted via router.use)
- `/ai/*` → ai.js (AI Applications)
  - `/ai/code-generator` → "ai/codeGenerator" (Code Generator)
  - `/ai/code-generator-new` → "ai/codeGeneratorNew" (Code Generator New)
  - `/ai/image-generator` → "ai/imageGenerator" (Image Generator)
  - `/ai/text-generator` → "ai/textGenerator" (Text Generator)
  - `/ai/text-generator-new` → "ai/textGeneratorNew" (Dashboard subTitle)
  - `/ai/video-generator` → "ai/videoGenerator" (Video Generator)
  - `/ai/voice-generator` → "ai/voiceGenerator" (Voice Generator)
- `/authentication/*` → authentication.js (Login/Logout Flows)
- `/blog/*` → blog.js (Blog Management)
- `/chart/*` → chart.js (Data Visualization)
- `/components/*` → components.js (UI Components Showcase)
- `/crypto-currency/*` → cryptoCurrency.js (Cryptocurrency Tracking)
- `/dashboard/*` → dashboard.js (Dashboard Variants)
  - `/dashboard/index2` → "dashboard/index2" (CRM Dashboard)
  - `/dashboard/index3` → "dashboard/index3" (eCommerce Dashboard)
  - `/dashboard/index4` → "dashboard/index4" (Crypto Dashboard)
  - `/dashboard/index5` → "dashboard/index5" (Investment Dashboard)
  - `/dashboard/index6` → "dashboard/index6" (LMS Dashboard)
  - `/dashboard/index7` → "dashboard/index7" (NFT & Gaming Dashboard)
  - `/dashboard/index8` → "dashboard/index8" (Medical Dashboard)
  - `/dashboard/index9` → "dashboard/index9" (Analytics Dashboard)
  - `/dashboard/index10` → "dashboard/index10" (POS & Inventory Dashboard)
- `/forms/*` → forms.js (Forms)
  - `/forms/form-validation` → "forms/formValidation" (Form Validation)
  - `/forms/form-wizard` → "forms/formWizard" (Wizard)
  - `/forms/input-forms` → "forms/inputForms" (Input Form)
  - `/forms/input-layout` → "forms/inputLayout" (Input Layout)
- `/invoice/*` → invoice.js (Invoicing)
- `/role-and-access/*` → rolesAndAccess.js (Permission Management)
- `/settings/*` → settings.js (Settings)
- `/table/*` → table.js (Tables)
  - `/table/basic-table` → "table/basicTable" (Basic Table)
  - `/table/data-table` → "table/dataTable" (Data Table)
- `/users/*` → users.js (User Management)

**Note:** All routes render EJS views with title and subTitle passed to the template.

## 2. Views Structure

Views are EJS templates in `WowDash/views/`. Directory structure:

- `ai/` → AI generator templates (e.g., codeGenerator.ejs, imageGenerator.ejs, textGenerator.ejs)
- `authentication/` → Auth pages (e.g., login.ejs, register.ejs)
- `blog/` → Blog-related views
- `chart/` → Chart visualization templates
- `components/` → Component showcase views
- `cryptoCurrency/` → Crypto-specific dashboards
- `dashboard/` → Dashboard variants (index.ejs, index2.ejs to index10.ejs)
- `forms/` → Form templates (formValidation.ejs, formWizard.ejs, inputForms.ejs, inputLayout.ejs)
- `invoice/` → Invoice templates
- `layout/` → Shared layouts (e.g., main layout)
- `partials/` → Reusable partials (headers, footers, sidebars)
- `roleAndAccess/` → Role management views
- `settings/` → Settings pages
- `table/` → Table views (basicTable.ejs, dataTable.ejs)
- `users/` → User management views

**Key Views for Integration:**
- Dashboard variants for analytics and monitoring.
- AI views for prompt/agent integration.
- Forms and tables for data input/output with Airtable/Bright Data.

## 3. UI Components

UI components are Bootstrap 5-based with custom CSS (Sass in public/sass/). Examples from documentation/advance-components.html:

### Switches (Radio/Toggle)
- Classes: `form-switch switch-primary/switch-purple/switch-success/switch-warning`
- HTML: `<input type="checkbox" role="switch" id="switch1" checked> <label for="switch1">Switch Active</label>`
- Props/Types: Color variants (primary, purple, etc.), checked state (boolean).

### Carousel with Arrows
- Slick.js integration.
- HTML: `<div class="arrow-carousel"> <div class="gradient-overlay"> <img src="..."> <div class="position-absolute"> <h5>Title</h5> <p>Text</p> </div> </div> ... </div>`
- JS: `$('.arrow-carousel').slick({ infinite: true, slidesToShow: 1, arrows: true, ... })`
- Props: Images, titles, descriptions; options like autoplay, speed.

### Video Player
- Magnific Popup for iframe.
- HTML: `<div class="position-relative"> <img src="video-img.png" class="w-100 radius-8"> <a href="youtube-url" class="magnific-video ..."> <iconify-icon icon="ion:play"></iconify-icon> </a> </div>`
- JS: `$('.magnific-video').magnificPopup({ type: 'iframe' })`
- Props: Image thumbnail, video URL.

### Image Upload (Multiple)
- Custom file input with preview and remove.
- HTML: `<div class="upload-image-wrapper"> <div class="uploaded-imgs-container"></div> <label for="upload-file-multiple" class="upload-file-multiple ..."> <iconify-icon icon="solar:camera-outline"></iconify-icon> <span>Upload</span> <input type="file" hidden multiple> </label> </div>`
- JS: Event listener on input change to create previews, revokeObjectURL on remove.
- Props: Multiple files, preview size (120px), remove functionality.

**Additional Components (Inferred from Structure):**
- Cards, buttons, tables (DataTables), charts (Chart.js), notifications, pricing tables, user grids/lists, tabs, galleries.
- All use RemixIcon for icons, Tailwind-like utilities in custom CSS.
- No TypeScript props defined (plain HTML/EJS); for React/TS adaptation, infer from classes (e.g., color props, disabled state).

## 4. UI Component Props/Types Reference

Since the template uses HTML/EJS with Bootstrap classes, the following infers TypeScript props for React components. These are derived from documentation examples (e.g., advance-components.html) and should be used when adapting to React. All components extend Bootstrap props where applicable.

### Switch (Toggle/Radio)
- **Component:** `<Switch />`
- **Props:**
  ```typescript
  interface SwitchProps {
    id: string;
    checked?: boolean;
    variant?: 'primary' | 'purple' | 'success' | 'warning' | 'danger' | 'info'; // Color class
    label: string;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
  }
  ```
- **Usage Example:** `<Switch id="switch1" checked variant="primary" label="Switch Active" />`
- **Notes:** Renders as form-switch with dynamic class based on variant.

### Carousel with Arrows
- **Component:** `<ArrowCarousel />`
- **Props:**
  ```typescript
  interface ArrowCarouselProps {
    slides: Array<{
      image: string;
      title: string;
      description: string;
    }>;
    autoplay?: boolean;
    autoplaySpeed?: number; // ms
    speed?: number; // transition speed
    infinite?: boolean;
    slidesToShow?: number; // default 1
    onSlideChange?: (index: number) => void;
  }
  ```
- **Usage Example:** `<ArrowCarousel slides={[{ image: 'path.png', title: 'Slide One', description: 'Text' }]} autoplay={false} />`
- **Notes:** Uses Slick.js; initialize with options in useEffect.

### Video Player
- **Component:** `<VideoPlayer />`
- **Props:**
  ```typescript
  interface VideoPlayerProps {
    thumbnail: string;
    videoUrl: string; // YouTube or iframe src
    playIcon?: string; // default 'ion:play'
    size?: { width: number; height: number }; // default 56px circle
    onPlay?: () => void;
  }
  ```
- **Usage Example:** `<VideoPlayer thumbnail="video-img1.png" videoUrl="https://youtube.com/watch?v=..." />`
- **Notes:** Uses Magnific Popup for modal iframe.

### Image Upload (Multiple)
- **Component:** `<ImageUpload />`
- **Props:**
  ```typescript
  interface ImageUploadProps {
    multiple?: boolean; // default true
    maxFiles?: number;
    acceptedTypes?: string[]; // e.g., ['image/*']
    previewSize?: { width: number; height: number }; // default 120px
    onFilesChange?: (files: File[]) => void;
    onRemove?: (file: File) => void;
    disabled?: boolean;
  }
  ```
- **Usage Example:** `<ImageUpload multiple onFilesChange={(files) => console.log(files)} />`
- **Notes:** Handles preview creation with URL.createObjectURL; revoke on remove.

### General Guidelines for Other Components
- **Cards:** Props include `title`, `subtitle`, `body`, `footer`, `variant` (e.g., 'primary').
- **Buttons:** `variant`, `size`, `disabled`, `onClick`.
- **Tables (DataTable):** `data` (array), `columns`, `pagination`, `searchable`.
- **Charts:** Integrate Chart.js; props like `type` ('bar', 'line'), `data`, `options`.
- **Icons:** Use RemixIcon; prop `icon` as string (e.g., 'solar:camera-outline'), `size`, `color`.
- **Forms:** Extend BootstrapForm; props for `validation`, `layout` ('horizontal', 'vertical').
- **All Components:** Include `className` for custom CSS, `id` for accessibility.

This reference ensures type-safe adaptations while preserving boilerplate styling and behavior.

## Adherence Guidelines
- **Routes:** Extend existing sub-routers for new features (e.g., /adapters/* for integrations).
- **Views:** Use partials for consistency; extend dashboard views for custom integrations.
- **UI Components:** Reuse classes and JS initializations; avoid breaking Bootstrap grid/responsiveness.

This catalogue ensures the boilerplate remains the foundation for all enhancements.