import type { Metadata } from "next";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Our Story | Argania Professional",
  description:
    "Meet Faiza Mansoor, co-founder of Argania Professional, and discover the personal journey behind our haircare and skincare rituals.",
};

export default function AboutPage() {
  return (
    <main className={styles["page"]}>
      <section
        className={styles["founder-hero"]}
        aria-labelledby="founder-hero-heading"
      >
        <div
          className={[styles["container"], styles["founder-hero-content"]].join(
            " ",
          )}
        >
          <span className={styles["eyebrow"]}>
            OUR STORY   /   ARGANIA PROFESSIONAL
          </span>
          <h1 id="founder-hero-heading">
            Every ritual begins
            <br />
            with <em>a story.</em>
          </h1>
          <p>
            More than a personal care brand, Argania began with one woman&apos;s
            search for a better way to care for her hair.
          </p>
          <a className={styles["founder-scroll-link"]} href="#founder-story">
            Meet the person behind Argania <span aria-hidden="true">↓</span>
          </a>
        </div>
        <span className={styles["founder-hero-ornament"]} aria-hidden="true">
          A
        </span>
      </section>

      <section
        id="founder-story"
        className={[styles["container"], styles["founder-profile"]].join(" ")}
        aria-labelledby="founder-name"
      >
        <figure className={styles["founder-portrait"]}>
          <div className={styles["founder-photo-wrap"]}>
            <img
              src="/about/faiza-mansoor.jpg"
              alt="Faiza Mansoor, co-founder of Argania Professional"
              width="558"
              height="814"
              loading="eager"
              decoding="async"
            />
          </div>
          <figcaption>
            <strong>Faiza Mansoor</strong>
            <span>Co-founder, Argania Professional</span>
          </figcaption>
        </figure>
        <div className={styles["founder-profile-copy"]}>
          <span className={styles["eyebrow"]}>
            MEET THE PERSON BEHIND THE BRAND
          </span>
          <h2 id="founder-name">
            Meet Faiza.
            <br />
            <em>The heart behind Argania.</em>
          </h2>
          <p className={styles["founder-lead"]}>
            Argania isn&apos;t just about products. It&apos;s about a personal
            journey of curiosity, resilience and care.
          </p>
          <p>
            Like many people trying to navigate haircare, Faiza Mansoor
            struggled to find products that felt right for her. While dealing
            with hair thinning concerns and questioning conventional cosmetic
            formulas, she began exploring the possibilities of argan oil.
          </p>
          <p>
            What started as a personal discovery grew into a deeper interest in
            haircare. Faiza immersed herself in research and experimented with
            homemade formulations, learning through her own experience and
            sharing those creations with people around her.
          </p>
          <p>
            The encouraging response from her community gave her the confidence
            to take the next step. She worked with experts to develop her early
            ideas into a professional personal-care range rooted in her
            commitment to quality, transparency and the experience of self-care.
          </p>
          <div className={styles["founder-profile-rule"]}>
            <span>FROM PERSONAL DISCOVERY</span>
            <i aria-hidden="true"></i>
            <span>TO SHARED CARE</span>
          </div>
        </div>
      </section>

      <section
        className={styles["founder-story-band"]}
        aria-label="The origins of Argania"
      >
        <div
          className={[
            styles["container"],
            styles["founder-story-band-inner"],
          ].join(" ")}
        >
          <span className={styles["eyebrow"]}>HOW IT ALL BEGAN</span>
          <p>
            &quot;What started as a personal journey grew into something she
            wanted to share.&quot;
          </p>
          <span className={styles["founder-story-band-note"]}>
            A brand built around the belief that beauty should feel personal.
          </span>
        </div>
      </section>

      <section
        className={[styles["container"], styles["founder-milestones"]].join(
          " ",
        )}
        aria-labelledby="founder-journey-title"
      >
        <div className={styles["founder-milestones-heading"]}>
          <div>
            <span className={styles["eyebrow"]}>THE JOURNEY</span>
            <h2 id="founder-journey-title">
              From a question
              <br />
              to <em>Argania.</em>
            </h2>
          </div>
          <p>Four chapters that shaped the brand you know today.</p>
        </div>
        <div className={styles["founder-milestone-grid"]}>
          <article className={styles["founder-milestone"]}>
            <span className={styles["founder-milestone-number"]}>01</span>
            <h3>A personal search</h3>
            <p>
              Her own haircare concerns sparked a desire to understand
              ingredients and explore different approaches to everyday care.
            </p>
          </article>
          <article className={styles["founder-milestone"]}>
            <span className={styles["founder-milestone-number"]}>02</span>
            <h3>Research &amp; discovery</h3>
            <p>
              Inspired by argan oil, Faiza researched haircare and began
              experimenting with homemade formulations.
            </p>
          </article>
          <article className={styles["founder-milestone"]}>
            <span className={styles["founder-milestone-number"]}>03</span>
            <h3>Shared with care</h3>
            <p>
              She shared her creations with people around her, and their
              encouragement helped the idea grow beyond her own routine.
            </p>
          </article>
          <article className={styles["founder-milestone"]}>
            <span className={styles["founder-milestone-number"]}>04</span>
            <h3>Argania is born</h3>
            <p>
              Collaborating with experts, she took those early ideas forward
              into a professional haircare and skincare range.
            </p>
          </article>
        </div>
      </section>

      <section
        className={styles["founder-quote"]}
        aria-labelledby="founder-quote-title"
      >
        <div
          className={[styles["container"], styles["founder-quote-layout"]].join(
            " ",
          )}
        >
          <div className={styles["founder-quote-left"]}>
            <span className={styles["eyebrow"]}>A NOTE FROM OUR FOUNDER</span>
            <div className={styles["founder-quote-mark"]} aria-hidden="true">
              “
            </div>
          </div>
          <div className={styles["founder-quote-content"]}>
            <h2 id="founder-quote-title">
              Welcome to ARGANIA, where every product is infused with the
              essence of human connection and the promise of radiant
              transformation.
            </h2>
            <div className={styles["founder-signoff"]}>
              <img
                src="/about/faiza-signature.png"
                alt="Faiza's handwritten signature"
                width="242"
                height="144"
                loading="eager"
              />
              <div>
                <strong>Faiza Mansoor</strong>
                <span>Co-founder, Argania Professional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={styles["founder-values"]}
        aria-labelledby="founder-values-title"
      >
        <div className={styles["container"]}>
          <div className={styles["founder-values-intro"]}>
            <span className={styles["eyebrow"]}>WHAT WE BELIEVE</span>
            <h2 id="founder-values-title">
              Nourish. Rejuvenate. <em>Pamper.</em>
            </h2>
            <p>
              The spirit behind Argania&apos;s approach to everyday haircare and
              skincare.
            </p>
          </div>
          <div className={styles["founder-values-grid"]}>
            <div className={styles["founder-value"]}>
              <span>01 / NOURISH</span>
              <h3>Care with intention.</h3>
              <p>
                Everyday routines built around the small, meaningful ways we
                care for ourselves.
              </p>
            </div>
            <div className={styles["founder-value"]}>
              <span>02 / REJUVENATE</span>
              <h3>Beauty that feels good.</h3>
              <p>
                Make room for freshness, softness and moments of renewal in your
                daily ritual.
              </p>
            </div>
            <div className={styles["founder-value"]}>
              <span>03 / PAMPER</span>
              <h3>Everyday indulgence.</h3>
              <p>
                Thoughtful personal care that feels special without feeling out
                of reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className={[styles["container"], styles["founder-last"]].join(" ")}
        aria-labelledby="founder-last-heading"
      >
        <div className={styles["founder-last-copy"]}>
          <span className={styles["eyebrow"]}>BECOME PART OF OUR STORY</span>
          <h2 id="founder-last-heading">
            Your ritual.
            <br />
            <em>Our reason.</em>
          </h2>
          <p>
            Discover the haircare and skincare essentials inspired by
            Faiza&apos;s journey and Argania&apos;s belief in approachable,
            personal self-care.
          </p>
          <div className={styles["founder-last-actions"]}>
            <Link href="/products" className={styles["btn"]}>
              Explore our collection <span aria-hidden="true">↗</span>
            </Link>
            <a href="#contact" className={styles["text-link"]}>
              Get in touch ↗
            </a>
          </div>
        </div>
        <div className={styles["founder-last-photo"]}>
          <div className={styles["founder-last-art"]} aria-hidden="true">
            <span className={styles["founder-last-art-logo"]}>A</span>
            <span className={styles["founder-last-art-wordmark"]}>
              ARGANIA<small>PROFESSIONAL</small>
            </span>
            <span className={styles["founder-last-art-strap"]}>
              NOURISH   ·   REJUVENATE   ·   PAMPER
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
