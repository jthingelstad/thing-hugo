# thing-theme

A clean, opinionated Hugo theme for [Micro.blog](https://micro.blog), with built-in support for:

- **[LLMs.txt](https://llmstxt.org/)** — auto-generated `/llms.txt` of the site and `llms.txt` for each section
- **[Pagefind](https://pagefind.app/) search** — a `/search/` page wired for the Pagefind UI
- **Weekly Thing** and **Another Thing** — newsletter signup partials you can enable by setting a form URL
- **Micro.blog conventions** — `microblog_head.html` hook, `figure` + `image` shortcodes, `conversation.js` replies

This theme is intentionally minimal: a short stylesheet built on CSS custom properties, no JavaScript, and the fewest layouts needed to render a blog. Restyle by overriding the CSS variables at `:root` in your Micro.blog custom CSS.

## Structure

```
theme.toml          # Hugo theme metadata
config.json         # Default site params (contentTypeName, feature toggles)
plugin.json         # Micro.blog plugin manifest
archetypes/
  default.md
layouts/
  _default/
    baseof.html
    single.html
    list.html
    list.llmstxt.txt    # Section-level LLMs.txt
  index.html
  index.llmstxt.txt     # Site-level LLMs.txt
  section/
    replies.html
  archive/
    list.html
  page/
    search.html         # Pagefind UI mount point
  partials/
    head.html
    header.html
    footer.html
    post-meta.html
    post-card.html
    pagination.html
    comments.html
    weekly-thing.html
    another-thing.html
    extended_head.html    # override to inject <head> HTML
    extended_footer.html  # override to inject pre-</body> HTML
  shortcodes/
    figure.html
    image.html
static/
  css/
    thing.css
```

## Configuration

All params are optional. Defaults live in `config.json`:

```json
{
  "params": {
    "contentTypeName": "post",
    "showReadingTime": false,
    "showPostMeta": true,
    "pagefindEnabled": true,
    "llmsTxtEnabled": true,
    "weeklyThingFormUrl": "",
    "anotherThingFormUrl": "",
    "primaryColor": "#2a5d8f",
    "accentColor": "#c25b3f"
  }
}
```

Site-level params you can set in Micro.blog or your Hugo site config:

| Param | Purpose |
|---|---|
| `subtitle` | Short tagline shown next to the site title and in meta tags |
| `description` | Used for home page meta description |
| `keywords` | Meta keywords |
| `intro` | Markdown rendered at the top of the home page |
| `author` | Byline author name |
| `dateFormat` | Go time format for post dates (default `January 2, 2006`) |
| `include_conversation` | If `true`, loads Micro.blog's `conversation.js` on single posts |
| `weeklyThingFormUrl` | POST endpoint for the Weekly Thing signup form |
| `anotherThingFormUrl` | POST endpoint for the Another Thing signup form |
| `weeklyThingTitle` / `weeklyThingBlurb` / `weeklyThingCta` / `weeklyThingEmailField` | Optional overrides for the Weekly Thing widget |
| `anotherThingTitle` / `anotherThingBlurb` / `anotherThingCta` / `anotherThingEmailField` | Same for Another Thing |

## Enabling LLMs.txt

Add an `llmstxt` output format to your Hugo site config (Micro.blog lets you override via the custom theme's config). In `config.toml`:

```toml
[outputFormats.llmstxt]
mediaType   = "text/plain"
baseName    = "llms"
isPlainText = true
notAlternative = true

[outputs]
home    = ["HTML", "RSS", "llmstxt"]
section = ["HTML", "RSS", "llmstxt"]
```

The theme ships the two templates (`layouts/index.llmstxt.txt` and `layouts/_default/list.llmstxt.txt`). After building, visit `/llms.txt` for the site overview, or `/{section}/llms.txt` for a section.

The `<head>` also advertises it with `<link rel="alternate" type="text/plain" href="/llms.txt">` when `Params.llmsTxtEnabled` is true.

## Enabling Pagefind search

Pagefind is a build-time indexer — it doesn't run during Hugo's build. The typical flow:

1. `hugo` builds the site into `public/`.
2. Run `npx pagefind --site public` to index the built HTML.
3. Pagefind writes `public/pagefind/` — the theme's `/search/` page loads `pagefind-ui.js` from there.

On Micro.blog you'll want to run Pagefind as a post-build step (CI job that publishes to the same host, or a hosted alternative). The `/search/` page is already wired up — create `content/search.md` with:

```markdown
---
title: Search
layout: search
---
```

## Weekly Thing / Another Thing signups

Set either `weeklyThingFormUrl` or `anotherThingFormUrl` in your site params to enable the signup widget in the footer. The form posts to the URL with an `email` field (override via `weeklyThingEmailField` / `anotherThingEmailField` for providers that expect a different name).

## Customizing the look

Override CSS variables in your Micro.blog custom CSS:

```css
:root {
  --color-primary: #8a3ffc;
  --color-accent: #ff7eb6;
  --font-serif: "Source Serif Pro", Georgia, serif;
  --measure: 42rem;
}
```

Everything — palette, type scale, spacing, reading column width — is a variable.

## License

MIT
