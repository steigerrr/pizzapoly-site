# Website translations

The website has 15 languages and 3 routes per language. English remains at `/`, `/roadmap/` and `/feedback/`. Other languages use their BCP 47 code as a prefix, for example `/tr/roadmap/`, `/es-419/feedback/` and `/pt-BR/`.

## Editing

Edit layout in `templates/home.html`, `templates/roadmap.html` or `templates/feedback.html`. Edit content in the corresponding language JSON file. Do not edit generated HTML files directly.

Each JSON section has the same ordered entries as `en.json`: common navigation, home, roadmap, feedback, and image descriptions. Keep existing indexes stable; append new entries and refer to them in templates as `{{section.index}}`. Image descriptions use `{n}` for the screenshot number and `{{images.2:1}}` to supply it. Templates escape translations before inserting them into HTML, including attributes.

After edits run:

```
node scripts/build-locales.cjs
node --test tests/localization.test.cjs
```

Commit the generated HTML and sitemap with the source changes. Vercel serves the committed pages directly; it needs no dependencies or build configuration. The generator fails if a catalog has missing or empty translations. No browser translation service, automatic redirect, or geolocation is used. The language picker preserves the current route and remains functional without JavaScript.

## Scope

Visible copy, page titles/descriptions, navigation labels, image alternatives, menu states and feedback validation/status messages are localized. Brand names and existing artwork/game screenshots are retained as supplied; text embedded in those images is not translated. Regional Spanish and Portuguese variants have separate catalogs and addresses.

The feedback endpoint still sends the original submitted text without translating it. Client-side messages map API failures into the page language. Its byte limit allows full-length CJK input, while existing field length validation is retained.
