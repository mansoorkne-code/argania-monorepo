import type { Metadata } from "next";
import Link from "next/link";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Argania Professional",
  description:
    "The story and values behind Argania Professional's everyday skincare and haircare rituals.",
};

const values = [
  {
    number: "01",
    title: "Nourish.",
    description:
      "Make space for ingredients and routines that help your hair and skin feel well cared for.",
  },
  {
    number: "02",
    title: "Rejuvenate.",
    description:
      "Bring a little freshness, energy and intention to the moments you give yourself.",
  },
  {
    number: "03",
    title: "Pamper.",
    description:
      "Find small everyday luxuries without making beauty feel out of reach.",
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Nourish · Rejuvenate · Pamper</span>
          <h1>The story behind the ritual.</h1>
          <p>A little more care, a little more everyday beauty.</p>
        </div>
      </header>

      <section className={`${styles.container} ${styles.aboutTop}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Welcome to Argania</span>
          <h2>
            Beauty that feels
            <br />
            <em>like self-care.</em>
          </h2>
          <p>
            Argania Professional was created around a simple belief: caring for
            yourself should be more than another item on your to-do list. It
            should be a nourishing pause in your everyday life.
          </p>
          <p>
            Inspired by the beauty of nature and the comforting qualities of
            argan oil, our skincare and haircare bring thoughtfully selected
            ingredients and everyday practicality together.
          </p>
          <Link className={styles.button} href="/products">
            Discover our collection ↗
          </Link>
        </div>
        <div className={styles.art}>
          <img
            src={getStorefrontAssetUrl("assets/day-lifestyle.webp")}
            alt="Argania day cream lifestyle"
            loading="lazy"
          />
        </div>
      </section>

      <section aria-label="Our values" className={styles.valuesBand}>
        <div className={`${styles.container} ${styles.valuesGrid}`}>
          {values.map((value) => (
            <article key={value.number}>
              <span className={styles.valueNumber}>{value.number}</span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.container} ${styles.aboutTop} ${styles.promise}`}
      >
        <div className={`${styles.art} ${styles.promiseArt}`}>
          <img
            src={getStorefrontAssetUrl("assets/glow-bathroom.webp")}
            alt="Argania Glow Detoxic serum in a bathroom ritual"
            loading="lazy"
          />
        </div>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Our promise</span>
          <h2>
            Feel-good beauty,
            <br />
            <em>for real life.</em>
          </h2>
          <p>
            We want Argania to be a brand you reach for instinctively:
            approachable, considered and made for the simple pleasure of taking
            care of yourself.
          </p>
          <p>
            From sulfate-free haircare to daily skin essentials, our mission is
            to make quality personal care more accessible.
          </p>
          <Link className={styles.textLink} href="/#contact">
            Get to know us ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
