import Link from "next/link";
import { Categories } from "./components/categories";
import { ArganiaHero } from "./components/argania-hero";
import { ProductCard } from "./products/product-card";
import { ReelEdit } from "./components/reel-edit";
import { NewsletterForm } from "./components/newsletter-form";
import { SectionHeading } from "./components/section-heading";
import { getCatalogProducts, type CatalogProduct } from "../lib/catalog";
import { getStorefrontAssetUrl } from "../lib/storefront-assets";
const asset = (name: string) => getStorefrontAssetUrl(`assets/${name}.webp`);
const shop = (query: string) => `/products?q=${encodeURIComponent(query)}`;
const editorial = [
  {
    image: "day-feature",
    kicker: "DAILY SKINCARE",
    title: "Skin Renewing Day Cream",
    text: "A bright, protected daytime ritual.",
    href: shop("Day Cream"),
    cta: "Shop Day Cream",
  },
  {
    image: "glow-beach",
    kicker: "GLOW DETOXIC",
    title: "Sunlit serum moments",
    text: "A little radiance, wherever the day takes you.",
    href: shop("Serum"),
    cta: "Shop Glow Detoxic",
  },
  {
    image: "aloe-hero",
    kicker: "FRESH CARE",
    title: "Aloe, soothe & refresh",
    text: "A calming moment in your everyday routine.",
    href: "/products?category=skincare",
    cta: "Explore Skincare",
  },
];
const moments = [
  {
    image: "day-lifestyle",
    label: "DAY CARE",
    title: "Skin Renewing Day Cream",
    text: "A little daily moisture for fresh-feeling skin.",
    query: "Day Cream",
    cta: "Shop Day Cream",
  },
  {
    image: "night-lifestyle",
    label: "NIGHT CARE",
    title: "Intensive Night Cream",
    text: "Nourishing care for your evening wind-down.",
    query: "Night Cream",
    cta: "Shop Night Cream",
  },
];
const quotes = [
  {
    person: "Nidhi",
    text: "Very nice shampoo for dry and damaged-looking hair, my hair feels more nourished and looks healthier.",
    product: "Kera Rescue Shampoo",
  },
  {
    person: "Puja",
    text: "I used the Argania Hair Masque as part of my pre-wedding hair care routine.",
    product: "Hair Masque",
  },
  {
    person: "Sheetal",
    text: "It made my hair feel smooth, soft and easy to manage.",
    product: "Argania Hair Serum",
  },
];
export default async function Home() {
  let products: CatalogProduct[] = [];
  try {
    products = (await getCatalogProducts()).products.slice(0, 4);
  } catch {
    /* The editorial storefront still works while the catalog is unavailable. */
  }
  return (
    <main id="app">
      <ArganiaHero />
      <Categories />
      <section
        className="section-space container home-products-section"
        id="shop-featured"
      >
        <SectionHeading
          kicker="THE BESTSELLERS"
          title="Your next beauty favourites"
          description="Shop our popular skincare and haircare picks, with prices in INR."
          href="/products"
          linkText="View all products"
        />
        {products.length ? (
          <div className="product-grid home-featured-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="catalog-unavailable">
            Our collection is being prepared. Please check back soon.
          </p>
        )}
        <div className="home-shop-link">
          <Link className="btn outline" href="/products">
            Shop all products <span>↗</span>
          </Link>
        </div>
      </section>
      <section className="container kera-duo-home-section">
        <Link href={shop("Kera Rescue")} className="kera-duo-home">
          <img
            src={getStorefrontAssetUrl(
              "assets/products/kera-rescue-duo/07-luxury-display.webp",
            )}
            alt="Kera Rescue Shampoo and Conditioner together"
            loading="lazy"
          />
          <div>
            <span className="eyebrow">COMPLETE THE HAIRCARE RITUAL</span>
            <h2>Kera Rescue Shampoo + Conditioner.</h2>
            <p>
              Explore the two-bottle keratin-infused haircare duo. Find your
              wash-day essentials together.
            </p>
            <span className="btn outline">Explore the duo ↗</span>
          </div>
        </Link>
      </section>
      <section className="offer-banner">
        <div className="container offer-banner-inner">
          <div className="offer-icon" aria-hidden="true">
            ✳
          </div>
          <div className="offer-banner-copy">
            <span className="eyebrow">A LITTLE SOMETHING EXTRA</span>
            <strong>Your next ritual comes with a treat.</strong>
            <span>
              Discover your next beauty favourite in the Argania collection.
            </span>
          </div>
          <Link className="offer-copy" href="/products">
            Explore the collection ↗
          </Link>
        </div>
      </section>
      <section className="trust-bar" aria-label="The Argania promise">
        <div className="container trust-grid">
          {[
            {
              title: "Thoughtfully created",
              text: "Care that feels personal",
              path: "M3 9l9-6 9 6v11H3z M9 20v-7h6v7",
            },
            {
              title: "Made for self-care",
              text: "Small daily rituals",
              path: "M12 22S3 16 3 10a9 9 0 0 1 18 0c0 6-9 12-9 12Z M9 10h6 M12 7v6",
            },
            {
              title: "Free delivery",
              text: "On orders above ₹2,500",
              path: "M3 7h12v11H3z M15 10h4l3 3v5h-7",
            },
            {
              title: "Professional care",
              text: "Beauty meets wellness",
              path: "M4 13c0-4 4-9 8-9s8 5 8 9-3 7-8 7-8-3-8-7Z M9 12l2 2 4-4",
            },
          ].map((item) => (
            <div className="trust-item" key={item.title}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={item.path} />
                {item.title === "Free delivery" && (
                  <>
                    <circle cx="7.5" cy="18.5" r="2" />
                    <circle cx="18.5" cy="18.5" r="2" />
                  </>
                )}
              </svg>
              <div>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section-space container home-tight">
        <SectionHeading
          kicker="DISCOVER MORE"
          title="Meet your care essentials."
          description="From gentle hydration to a glowing complexion, explore the rituals made for you."
        />
        <div className="campaign-grid">
          {editorial.map((card) => (
            <Link
              className="campaign-story-card"
              href={card.href}
              key={card.title}
            >
              <img
                src={asset(card.image)}
                alt={`${card.title} banner`}
                loading="lazy"
              />
              <span className="campaign-card-kicker">{card.kicker}</span>
              <div className="campaign-card-copy">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span>{card.cta} &nbsp;↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-space container home-tight">
        <SectionHeading
          kicker="DAY & NIGHT RITUALS"
          title="Care for every moment."
          description="Your daily moisturising essentials, from morning to night."
        />
        <div className="campaign-pair">
          {moments.map((moment) => (
            <Link
              className="campaign-split"
              href={shop(moment.query)}
              key={moment.label}
            >
              <img
                src={asset(moment.image)}
                alt={`${moment.title} banner`}
                loading="lazy"
              />
              <span className="campaign-chip">{moment.label}</span>
              <div className="campaign-split-copy">
                <h3>{moment.title}</h3>
                <p>{moment.text}</p>
                <span>{moment.cta} ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-space container home-tight">
        <div className="campaign-feature">
          <div className="campaign-feature-media">
            <img
              src={asset("dtan-feature")}
              alt="Argania D-Tan pack banner"
              loading="lazy"
            />
          </div>
          <div className="campaign-feature-copy">
            <span className="eyebrow">TREATMENT SPOTLIGHT</span>
            <h2>Refresh your skincare ritual.</h2>
            <p>
              Discover treatments and skincare essentials for a refreshed,
              cared-for feel.
            </p>
            <div className="story-icon">
              <div>✧ &nbsp; Your self-care moment</div>
              <div>✧ &nbsp; Skin-loving routines</div>
              <div>✧ &nbsp; A refreshing ritual</div>
            </div>
            <Link className="btn" href="/products?category=skincare">
              Explore skincare ↗
            </Link>
          </div>
        </div>
      </section>
      <ReelEdit />
      <section className="section-space quote-section home-tight">
        <div className="container">
          <SectionHeading
            kicker="REAL VOICES, REAL RITUALS"
            title="A little love goes a long way."
            description="Words shared by Argania customers."
            centered
          />
          <div className="quote-grid">
            {quotes.map((quote) => (
              <div className="quote-card" key={quote.person}>
                <div>
                  <div className="quote-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>“{quote.text}”</blockquote>
                </div>
                <div className="reviewer">
                  {quote.person}
                  <small>
                    Reviewing {quote.product} · Review featured on the current
                    store
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-space container home-tight">
        <SectionHeading
          kicker="THE ARGANIA EDIT"
          title="Inspired by everyday beauty."
          description="A closer look at the skincare and haircare moments we love."
          centered
        />
        <div className="campaign-gallery">
          {[
            "day-forest-pack",
            "night-forest-pack",
            "dtan-closeup",
            "hairspa-wash",
            "glow-collage",
            "glow-bathroom",
          ].map((image, i) => (
            <img
              key={image}
              src={asset(image)}
              alt={`Argania campaign visual ${i + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      </section>
      <section className="section-space newsletter-band home-tight">
        <div className="container newsletter-inner">
          <div>
            <span className="eyebrow">STAY IN THE LOOP</span>
            <h2>Get updates on launches, offers and rituals.</h2>
            <p>
              Beauty notes, new launches, and inspiration for your next everyday
              ritual.
            </p>
          </div>
          <NewsletterForm id="home-newsletter-email" />
        </div>
      </section>
    </main>
  );
}
