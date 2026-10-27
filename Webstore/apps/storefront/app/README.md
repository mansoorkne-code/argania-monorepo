# Storefront reference design

The storefront ports the layout rules and artwork from the supplied
`argania-storefront/index.html`, `styles.css` and homepage markup in `script.js`.
`reference.css` retains the rules used by the React components; the prototype
script is not loaded into Next.js. `globals.css` adds native dialog/accessibility
and application integration rules. Keep shared typography, section spacing,
hero aspect ratio and responsive breakpoints in the reference stylesheet.

The homepage follows the reference order: six campaign banners, three collection
tiles, catalog cards, Kera Rescue duo, offer strip, trust bar, editorial campaigns,
day/night pair, treatment feature, four reel previews, reviews, gallery, newsletter
band, footer newsletter and five-column footer. Desktop and mobile use the same
uncropped banner images and the reference caption/control bar.

Brand/campaign assets continue using Supabase Storage URLs. The three collection
tiles use active category image/alt/description metadata where available; reference
artwork supplies their defaults. Catalog prices, variants and product images still
come from Supabase. Category aliases such as `haircare` resolve `hair-care` as well.
Category reads support deployments that have not yet added `image_alt`.

Product-card bag links open the existing variant selector before the server cart
action. Account/wishlist links retain the current account destination. The search
panel submits to the real product search, newsletters open the existing email
request flow, and support uses the configured brand email. Editorial reels are
animated image previews. Spin & Save is explicitly a design preview and does not
create coupons or change checkout pricing. Routine guidance is local static copy.

Verify with storefront TypeScript/build, workspace lint, and browser checks for
carousel controls, search, collection links, product detail, mobile navigation,
reel dialogs, widgets, and both newsletter layouts. No database migration or live
storage writes are required for these UI changes.
