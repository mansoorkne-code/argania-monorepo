import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import { ArganiaHero } from "./components/argania-hero";
import { Categories } from "./components/categories";
import styles from "./page.module.css";

const principles = [
  {
    number: "01",
    title: "Less, with intention",
    description: "A considered edit for the small rituals that make a day feel like your own.",
  },
  {
    number: "02",
    title: "Made for real life",
    description: "Useful, tactile essentials designed to find their place in your everyday.",
  },
  {
    number: "03",
    title: "A slower point of view",
    description: "Thoughtful choices, quiet details, and room to enjoy the moment.",
  },
];

function BotanicalMark() {
  return (
    <svg aria-hidden="true" className={styles.botanicalMark} viewBox="0 0 240 280" fill="none">
      <path d="M119 244c-4-64 12-123 56-180" stroke="currentColor" strokeWidth="2" />
      <path d="M119 215C70 204 49 171 49 139c39 2 65 24 70 76Z" fill="currentColor" />
      <path d="M130 174c-1-48 25-76 62-86 7 38-12 70-62 86Z" fill="currentColor" />
      <path d="M117 132c-37-14-53-43-49-75 34 9 53 31 49 75Z" fill="currentColor" />
      <path d="M142 119c9-34 35-52 65-50-3 31-23 51-65 50Z" fill="currentColor" />
      <path d="M120 246h56" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <ArganiaHero />
      <Categories />

      <section aria-label="Our point of view" className={styles.principles}>
        {principles.map((principle) => (
          <Card className={styles.principleCard} key={principle.number}>
            <CardContent className={styles.principleContent}>
              <span className={styles.principleNumber}>{principle.number}</span>
              <h2>{principle.title}</h2>
              <p>{principle.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="approach-title" className={styles.approach} id="our-approach">
        <div className={styles.approachVisual}>
          <div aria-hidden="true" className={styles.approachSun} />
          <BotanicalMark />
          <span>ROOTED IN THE EVERYDAY</span>
        </div>
        <div className={styles.approachCopy}>
          <span className={styles.sectionKicker}>A note from Argania</span>
          <h2 id="approach-title">Make space for the things that feel like you.</h2>
          <p>
            We believe a routine can be more than a list of things to do. It can be a pause, a small
            pleasure, a way back to yourself. Argania is a home for thoughtful essentials that help
            make room for those moments.
          </p>
          <Link className={styles.textLink} href="#our-approach">
            Our approach <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="journal-title" className={styles.journal} id="journal">
        <div>
          <span className={styles.sectionKicker}>Notes for a slower day</span>
          <h2 id="journal-title">Small thoughts, little rituals.</h2>
        </div>
        <Link className={styles.textLink} href="/#journal">
          From the journal <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section aria-labelledby="closing-title" className={styles.closing}>
        <span className={styles.sectionKicker}>Take it at your own pace</span>
        <h2 id="closing-title">Your everyday, with a little more care.</h2>
        <Link className={`ui-button ui-button--outline ui-button--lg ${styles.closingButton}`} href="/products">
          Find your ritual
        </Link>
      </section>
    </main>
  );
}
