# thing-hugo

The theme for [www.thingelstad.com](https://www.thingelstad.com), Jamie
Thingelstad's blog on [micro.blog](https://micro.blog). It is a micro.blog
**plug-in installed over the Blank design**, built for micro.blog's Hugo 0.158.

- **IndieWeb:** h-entry on every post, reply and page; an author h-card; rel=me;
  `u-in-reply-to` on replies; micro.blog's `microblog_head`, conversations and
  microhooks kept intact.
- **[Pagefind](https://pagefind.app/) search:** per-post indexing with year and
  category filters, a Search page, and an "Ask Thingy" link as the second path.
- **[llms.txt](https://llmstxt.org/):** one capped, site-level `/llms.txt`.
- **Jamie's sites:** a strip above the header and an "Also from Jamie" footer,
  from `data/sites.json`.
- **Minimal:** one fingerprinted stylesheet built from CSS custom properties; the
  only scripts are Pagefind on the Search page and micro.blog's `conversation.js`.

`main` is the original version. `v2` is this rewrite.

## Install on micro.blog

1. **Design:** set the blog's design to **Blank** and Hugo version to **0.158**.
2. **Plug-in:** Plug-ins → Find Plug-ins → install from this repository, branch
   `v2`. (micro.blog layers the plug-in over Blank: Blank supplies
   `microblog_head`, the feeds, `/archive/` and `/photos/`; this theme supplies
   everything else.)
3. **Pagefind:** Design → Actions → enable **Pagefind**. micro.blog runs it on
   every publish and serves the bundle at `/pagefind/`. Search results update
   on the next publish after any theme change.
4. **Search page:** create a page titled **Search** at `/search/` whose body is
   just:

   ```
   {{< search >}}
   ```

   (micro.blog discards custom front matter, so a shortcode, not a `layout:`
   field, selects the search UI.) Do not create a page at `/pagefind/`: that path
   belongs to the Pagefind bundle.
5. Republish and check `/search/`, `/llms.txt` and a post's page source.

## Settings

micro.blog shows the `plugin.json` fields on the plug-in's settings page. They are
single-line inputs, so lists are comma-separated.

| Setting | Default | Purpose |
| --- | --- | --- |
| `sites_include` | empty | Ids of sites outside the publishing system to list anyway, e.g. `escape` |
| `signup_sites` | empty | Ids of sites to show subscribe links for in the footer, e.g. `weekly, another` |
| `llmstxt_recent` | `50` | Recent titled posts listed in `/llms.txt` |

Other params (`config.json` defaults, or the site's own config):

| Param | Default | Purpose |
| --- | --- | --- |
| `contentTypeName` | `post` | Content type treated as posts on home, lists and llms.txt |
| `showPostMeta` | `true` | Date and reading-time line on posts |
| `showReadingTime` | `false` | Reading time in that line |
| `pagefindEnabled` | `true` | Pagefind attributes and the Search link |
| `search_path` | `/search/` | Where the Search page lives |
| `llmsTxtEnabled` | `true` | Advertise `/llms.txt` in `<head>` and the footer |
| `subtitle`, `intro`, `keywords`, `dateFormat` | | As in v1 |

From micro.blog's own settings: `description`, `author.{name,avatar,username}`,
`github_username`, `include_conversation`, `plugins_js`, `theme_seconds`.

## Microhooks

Like Tiny Theme, the theme calls optional partials so other plug-ins and custom
templates can add markup. Each is guarded with `templates.Exists`; create
`layouts/partials/microhook-<name>.html` to use one. Names follow Tiny's so
existing plug-ins keep working:

`head`, `navigation`, `before-post-list`, `below-post-in-list`, `after-post-list`,
`before-post`, `post-byline`, `before-page-content`, `after-page-content`,
`categories`, `category-header`, `after-post`, `before-comments`,
`after-comments`, `before-replies`, `after-replies`, `footer`,
`before-closing-body`.

## Design tokens

`static/assets/css/tokens.css` is **generated**. The source of truth is
`design/tokens.css` in the private workspace, copied in by
`scripts/sync-shared.sh` together with `data/sites.json` (from
`shared/sites.json`). Edit those, not the copies. `theme-color` is read from
`--color-accent`.

## Structure

```
config.json                   module mounts, llmstxt output, ten micro.blog home outputs + llmstxt, params
plugin.json                   micro.blog plug-in manifest and settings fields
data/sites.json               Jamie's sites (generated copy)
layouts/
  _default/{baseof,single,list}.html
  index.html                  paginated home
  index.llmstxt.txt           /llms.txt
  replies/section.html        /replies/
  archive/list.html           paginated archive section, if one exists
  page/search.html            search layout (the shortcode is the micro.blog path)
  robots.txt                  allow all + sitemap
  partials/                   head, header, footer, h-card, asset, microhook,
                              pagefind-meta, reply-context, search-ui, sites*,
                              signup, title, list-param, post-card, post-meta, ...
  shortcodes/{figure,image,search}.html
static/assets/
  css/{tokens,thing}.css      bundled, minified and fingerprinted by partials/asset.html
  js/search.js
```

All CSS and JS go through `partials/asset.html`. The module mounts list layouts,
static, static/assets→assets and data: declaring any mount drops Hugo's
defaults, so add one for any new top-level directory.

## Developing

Develop in the workspace, which pins Hugo 0.158, generates micro.blog-shaped
sample content, and gates every change with `scripts/check.sh` (zero warnings,
no deprecations, links, microformats, Pagefind scope, llms.txt cap).

## License

MIT
