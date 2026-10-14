# Pizzapoly site design

This system consolidates the existing Pizzapoly identity across Home, Roadmap and Feedback. The logo, existing promotional art, gameplay images, orange accent, dark palette, original product claims and external destinations remain the source of truth.

## Shared implementation

- `/assets/site.css` contains the palette, typography, spacing, responsive layouts and interaction states.
- `/assets/site.js` contains navigation and accessible screenshot dialog behavior.
- All three HTML routes use identical header and footer markup. Set `aria-current="page"` on the active navigation link.
- Vercel serves committed static HTML without a frontend framework. After changing a template or translation, run `node scripts/build-locales.cjs`. Feedback continues to call the existing `/api/feedback` Vercel function.

## Visual rules

Warm charcoal ground, cream text and a single orange accent derive from the existing game artwork. Barlow Condensed is the heading face; Manrope is the body and control face. Keep major headings within 96px, use solid accent text, and preserve readable secondary text contrast.

The content width is 1160px. Navigation, page titles and footer align to the same grid on every route. Use open sections and subtle separators for prose and roadmaps; reserve contained surfaces for inputs and imagery. Avoid decorative gradients, glows, emoji feature icons and endlessly repeated feature cards.

## Page roles

- Home: game art, gameplay explanation, Steam wishlist and trailer; retain the complete gallery and social destinations.
- Roadmap: distinguish existing core, Early Access focus and longer-term ideas without invented dates or completion percentages.
- Feedback: visible labels, native validation, sending/error/success states and retained entered text after a failed request.

## Accessibility

Keyboard-visible focus, skip navigation, reduced-motion support, 44px social targets, a native dialog with Escape dismissal and automatic focus restoration. Mobile navigation is available without JavaScript and collapses only after its controller has initialized.

## Languages

Fifteen language catalogs in `/locales` generate 45 static pages from `/templates`. English retains the existing root routes; other languages use a prefix. Every page has a language picker that retains the current route and exposes all languages by native name. On narrow screens its trigger uses the language code to leave room for the brand and menu. Translations, canonical URLs, alternate-language metadata, image alternatives and feedback messages are generated together. CJK headings use natural line height; long translations can wrap. Navigation collapses at 960px to accommodate expanded labels.
