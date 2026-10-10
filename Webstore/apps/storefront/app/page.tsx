import Link from "next/link";
import { Categories } from "./components/categories";
import { ArganiaHero } from "./components/argania-hero";
import { ProductCard } from "./products/product-card";
import { getCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { getStorefrontAssetUrl } from "../lib/storefront-assets";
import styles from "./page.module.css";

const editorial = [
  {
    image: "assets/day-feature.webp",
    kicker: "DAILY SKINCARE",
    title: "Skin renewing day cream",
    text: "A bright, protected daytime ritual.",
    href: "/products?category=skincare",
    cta: "Explore skincare",
  },
  {
    image: "assets/glow-beach.webp",
    kicker: "GLOW DETOXIC",
    title: "Sunlit serum moments",
    text: "A little radiance, wherever the day takes you.",
    href: "/products?category=skincare",
    cta: "Discover the glow edit",
  },
  {
    image: "assets/aloe-hero.webp",
    kicker: "FRESH CARE",
    title: "Aloe, soothe & refresh",
    text: "A calming moment in your everyday routine.",
    href: "/products?category=body-care",
    cta: "Explore body care",
  },
];

const campaignPair = [
  {
    image: "assets/day-lifestyle.webp",
    label: "DAY CARE",
    title: "Skin renewing day cream",
    href: "/products?category=skincare",
  },
  {
    image: "assets/night-lifestyle.webp",
    label: "NIGHT CARE",
    title: "Intensive night cream",
    href: "/products?category=skincare",
  },
];

const stories = [
  { image: "assets/day-feature.webp", alt: "Argania daily skincare" },
  { image: "assets/glow-beach.webp", alt: "Glow Detoxic serum" },
  { image: "assets/aloe-hero.webp", alt: "Aloe care" },
];

export default async function Home() {
  let products: CatalogProduct[] = [];
  try {
    products = (await getCatalogProducts()).products.slice(0, 4);
  } catch {
    // The editorial storefront remains useful while the catalog is being configured.
  }

  return (
    <main className={styles.home}>
      <ArganiaHero />
      <Categories />

      <section className={styles.section} id="bestsellers">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>THE BESTSELLERS</span>
            <h2>Your next beauty favourites.</h2>
            <p>Shop popular skincare and haircare picks from Argania.</p>
          </div>
          <Link href="/products">
            View all products <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {products.length ? (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className={styles.catalogEmpty}>
            Our collection is being prepared. Please check back soon.
          </p>
        )}
      </section>

      <section className={styles.duo}>
        <Link href="/products?category=haircare" className={styles.duoLink}>
          <img
            src={getStorefrontAssetUrl(
              "assets/products/kera-rescue-duo/07-luxury-display.webp",
            )}
            alt="Kera Rescue shampoo and conditioner haircare duo"
            loading="lazy"
          />
          <span>
            <small>COMPLETE THE HAIRCARE RITUAL</small>
            <strong>Kera Rescue Shampoo + Conditioner.</strong>
            <em>Explore the duo ↗</em>
          </span>
        </Link>
      </section>

      <section className={styles.trust} aria-label="The Argania promise">
        {[
          "Thoughtfully created|Care that feels personal",
          "Made for self-care|Small daily rituals",
          "Free delivery|On orders above ₹2,500",
          "Professional care|Beauty meets wellness",
        ].map((item) => {
          const [title, text] = item.split("|");
          return (
            <div key={title}>
              <span aria-hidden="true">✧</span>
              <p>
                <strong>{title}</strong>
                <small>{text}</small>
              </p>
            </div>
          );
        })}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>DISCOVER MORE</span>
            <h2>Meet your care essentials.</h2>
            <p>
              From gentle hydration to a glowing complexion, find the rituals
              made for you.
            </p>
          </div>
        </div>
        <div className={styles.editorialGrid}>
          {editorial.map((story) => (
            <Link
              href={story.href}
              className={styles.editorialCard}
              key={story.title}
            >
              <img
                src={getStorefrontAssetUrl(story.image)}
                alt={story.title}
                loading="lazy"
              />
              <span>{story.kicker}</span>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
              <b>{story.cta} ↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.dayNight}`}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>DAY & NIGHT RITUALS</span>
            <h2>Care for every moment.</h2>
            <p>Your daily moisturising essentials, from morning to night.</p>
          </div>
        </div>
        <div className={styles.pairGrid}>
          {campaignPair.map((story) => (
            <Link href={story.href} key={story.label}>
              <img
                src={getStorefrontAssetUrl(story.image)}
                alt={story.title}
                loading="lazy"
              />
              <span>{story.label}</span>
              <strong>{story.title}</strong>
              <em>Explore the ritual ↗</em>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.feature}>
        <img
          src={getStorefrontAssetUrl("assets/dtan-feature.webp")}
          alt="Argania D-Tan skincare treatment"
          loading="lazy"
        />
        <div>
          <span className={styles.eyebrow}>TREATMENT SPOTLIGHT</span>
          <h2>Refresh your skincare ritual.</h2>
          <p>
            Discover treatments and skincare essentials for a refreshed,
            cared-for feel.
          </p>
          <Link href="/products?category=skincare">Explore skincare ↗</Link>
        </div>
      </section>

      <section className={styles.quotes}>
        <span className={styles.eyebrow}>REAL VOICES, REAL RITUALS</span>
        <h2>A little love goes a long way.</h2>
        <div>
          {[
            [
              "Very nice shampoo for dry and damaged-looking hair; my hair feels nourished and looks healthier.",
              "Nidhi",
            ],
            [
              "I used the Argania Hair Masque as part of my pre-wedding hair care routine.",
              "Puja",
            ],
            [
              "It made my hair feel smooth, soft and easy to manage.",
              "Sheetal",
            ],
          ].map(([quote, person]) => (
            <article key={person}>
              <span>★★★★★</span>
              <blockquote>“{quote}”</blockquote>
              <strong>{person}</strong>
              <small>Argania customer</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.gallery}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>THE ARGANIA EDIT</span>
            <h2>Inspired by everyday beauty.</h2>
            <p>A closer look at the skincare and haircare moments we love.</p>
          </div>
        </div>
        <div>
          {stories.map((story) => (
            <img
              key={story.image}
              src={getStorefrontAssetUrl(story.image)}
              alt={story.alt}
              loading="lazy"
            />
          ))}
          <img
            src={getStorefrontAssetUrl("assets/hairspa-wash.webp")}
            alt="Argania salon hair spa"
            loading="lazy"
          />
          <img
            src={getStorefrontAssetUrl("assets/glow-collage.webp")}
            alt="Argania skincare range"
            loading="lazy"
          />
          <img
            src={getStorefrontAssetUrl("assets/glow-bathroom.webp")}
            alt="Argania skincare at home"
            loading="lazy"
          />
        </div>
      </section>

      <section className={styles.newsletter}>
        <span className={styles.eyebrow}>A LITTLE MORE SELF-CARE</span>
        <h2>Good things in your inbox.</h2>
        <p>Beauty notes, new rituals, and the occasional little surprise.</p>
        <form action="mailto:argania.professional@gmail.com" method="get">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="body"
            type="email"
            placeholder="Your email address"
            required
          />
          <button type="submit">Join us ↗</button>
        </form>
        <small>Opens your email app to request updates.</small>
      </section>
    </main>
  );
}
