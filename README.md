# thing-hugo

The theme for [www.thingelstad.com](https://www.thingelstad.com), Jamie
Thingelstad's blog on [micro.blog](https://micro.blog). It is a micro.blog
**plug-in installed over the Blank design**, built for micro.blog's Hugo 0.158.

- **IndieWeb:** h-entry on every post, reply and page; an author h-card; rel=me;
  `u-in-reply-to` on replies; micro.blog's `microblog_head` and conversations
  kept intact.
- **v2 design:** black and white on white, with a dark mode that follows the
  reader's system. Colour marks only Jamie's other sites: the Weekly Thing
  (blue), Another Thing (red) and Thingy (tangerine). Inter Tight headings and
  Inter body, self-hosted (SIL OFL, `static/assets/fonts/`). One 1120px frame
  shared by the sites strip, header, content and footer; lists add a rail.
- **Home:** a hello beside a Weekly Thing subscribe card, then the stream.
  Titled posts show an excerpt, microposts show whole. Stream photos are 4:3
  crops; three or more become a square grid with a "+N" tile. A post's own
  page shows its photos whole.
- **The rail:** Ask Thingy, recent Weekly Thing issues, Another Thing, On This
  Day and Browse.
- **Under a post:** Kudos, reply links and "Explore with Thingy", a Weekly Thing
  card, Keep going (one more post and the podcast), then Earlier / Later.
- **Archive:** `/archive/` is a photo tile for every year plus the categories;
  each year page lists every post by month, 100 to a page.
- **[Pagefind](https://pagefind.app/) search:** the Search page draws results
  in the theme's style, with Best match / Newest and year and category filters;
  Ask Thingy is the second path.
- **Trip days:** a `{{< trip >}}` shortcode draws "Go to day" chips.
- **Tinylytics built in:** page hits and Kudos, no plug-in needed.
- **[llms.txt](https://llmstxt.org/):** one capped, site-level `/llms.txt`.
- **Jamie's sites:** a strip above the header and an "Also from Jamie" footer,
  from `data/sites.json`.
- **Minimal:** one fingerprinted stylesheet built from CSS custom properties.
  Scripts: the phone menu, the rail's Weekly Thing / Another Thing / On This
  Day lists, Pagefind on the Search page, Tinylytics, and micro.blog's
  `conversation.js` and `narration.js`. Every page reads in full without them.

## Install on micro.blog

1. **Design:** set the blog's design to **Blank** and Hugo version to **0.158**.
2. **Plug-in:** Plug-ins → Find Plug-ins → install from this repository
   (micro.blog installs `main`). micro.blog layers the plug-in over Blank: Blank
   supplies `microblog_head` and the feeds; this theme supplies everything else,
   including the `/archive/` and `/photos/` pages. Remove any other theme
   plug-in (Tiny Theme) so the two don't layer over each other. If the
   Tinylytics plug-in is installed, uninstall it: the theme loads Tinylytics
   itself.
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
5. Republish and check `/search/`, `/archive/`, a year page, `/llms.txt` and a
   post's page source.

## Trip days

Put the shortcode at the end of each day's post:

```
{{< trip "QMSB Trip" >}}
{{< trip "QMSB Trip" "https://www.thingelstad.com/collections/qmsb-2025" >}}
{{< trip prefix="QMSB Trip" name="QMSB Trip 2025" url="/collections/qmsb-2025" >}}
```

The days are the posts whose titles start with the prefix ("QMSB Trip - Day
7"), oldest first, so earlier days pick up each new one without an edit. Each
chip shows the "Day N" in its title (else its place in the trip); the post's
own day is in ink. Posts with the same prefix more than two weeks apart are
separate trips. The second argument, or `url`, adds "The whole trip". The name
defaults to the prefix plus the trip's year. Nothing shows until a trip has
two days or a url.

## Settings

micro.blog shows the `plugin.json` fields on the plug-in's settings page. They are
single-line inputs, so lists are comma-separated.

| Setting | Default | Purpose |
| --- | --- | --- |
| `sites_include` | empty | Ids of sites outside the publishing system to list anyway, e.g. `escape` |
| `signup_sites` | empty | Ids of sites to show subscribe links for in the footer, e.g. `weekly, another` |
| `home_greeting` | "Hi, I'm" and the first name | The home page's greeting |
| `intro` | a sentence about the blog | Home intro beside the Weekly Thing card (Markdown) |
| `rail_categories` | `Weekly Thing, Kubb, Coffee, Minnestar, Pokémon` | Categories in the rail's Browse list |
| `on_this_day_feed` | Micro Memories, US/Central | Feed for the rail's On This Day; blank turns it off |
| `on_this_day_path` | `/on-this-day/` | The full On This Day page |
| `featured_category` | `Featured` | Category whose camera photos lead each year's tile on `/archive/` |
| `photo_proxy` | micro.blog's resizer | Thumbnails of `/uploads/` photos; `off` uses the originals |
| `llmstxt_recent` | `50` | Recent titled posts listed in `/llms.txt` |
| `tinylytics_id` | the blog's embed id | Tinylytics embed id; blank turns Tinylytics and Kudos off |
| `tinylytics_options` | `hits&kudos=👍&uptime&webring=avatars&countries&publicstats` | The embed's feature flags |

Other params (`config.json` defaults, or the site's own config):

| Param | Default | Purpose |
| --- | --- | --- |
| `contentTypeName` | `post` | Content type treated as posts on home, lists and llms.txt |
| `showPostMeta` | `true` | Date and reading-time line on posts |
| `showReadingTime` | `true` | Reading time beside a titled post's date |
| `pagefindEnabled` | `true` | Pagefind attributes and the Search link |
| `search_path` | `/search/` | Where the Search page lives |
| `llmsTxtEnabled` | `true` | Advertise `/llms.txt` in `<head>` and the footer |
| `subtitle`, `intro`, `keywords`, `dateFormat` | | As in v1 |

From micro.blog's own settings: `description`, `author.{name,avatar,username}`,
`github_username`, `include_conversation`, `plugins_js`, `theme_seconds`.

## Plug-ins and microhooks

The theme calls one Tiny-style microhook, `microhook-category-header.html`,
because micro.blog delivers category intros through it (Jamie's Coffee page).
What the blog used the others for is built in, as are the styles post bodies
lean on: `.callout`, `.aside`, `.alert` and the `.chat` conversation markup
(Tiny-era Custom CSS no longer needs to carry them). It does detect the partials these micro.blog plug-ins ship and adds each one to
the pill row under a post: Reply by Email (`reply-by-email.html`), Conversation
Link (`conversation-link.html`) and Reply on Mastodon (`reply-on-mastodon.html`).
Menu links keep Tiny's `page-link {Name}` classes for Custom CSS.

## Design tokens

`static/assets/css/tokens.css` is **generated**. The source of truth is
`design/tokens.css` in the private workspace, copied in by
`scripts/sync-shared.sh` together with `data/sites.json` (from
`shared/sites.json`). Edit those, not the copies. `theme-color` is read from
`--theme-color` and `--theme-color-dark`.

## Structure

```
config.json                   module mounts, llmstxt output, ten micro.blog home outputs + llmstxt, params
plugin.json                   micro.blog plug-in manifest and settings fields
data/sites.json               Jamie's sites (generated copy)
layouts/
  _default/{baseof,single,list}.html   list.html also draws the year pages
  _default/list.archivehtml.html  /archive/: year tiles and categories
  _default/list.photoshtml.html   /photos/: photo grid with alt text
  index.html                  home: hello, Weekly Thing card, stream, rail
  opengraph.html              social card micro.blog renders to an image
  index.llmstxt.txt           /llms.txt
  replies/section.html        /replies/
  archive/list.html           paginated archive section, if one exists
  page/search.html            search layout (the shortcode is the micro.blog path)
  robots.txt                  allow all + sitemap
  partials/                   head, header, footer, h-card, asset, rail,
                              post-card, stream-content, post-meta,
                              post-actions, keep-going, year-page,
                              archive-list, search-page, search-ui,
                              pagefind-meta, trip-posts, sites*, ...
  shortcodes/{figure,image,search,trip}.html
static/assets/
  css/{tokens,thing}.css      bundled, minified and fingerprinted by partials/asset.html
  fonts/                      Inter and Inter Tight (woff2, OFL)
  js/{nav,sites,search}.js    phone menu; rail lists; the Search page
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
