"use client";
import { useState } from "react";
import Link from "next/link";
import { SectionHeading } from "./section-heading";
import { ReferenceDialog } from "./reference-dialog";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
const reels = [
  {
    label: "01 / HAIRCARE",
    title: "Salon-like hair spa at home",
    description: "Massage, nourish and rinse into softer-looking hair.",
    images: ["hairspa-feature", "hairspa-wash", "hairspa-howto"],
    query: "Hair Spa",
  },
  {
    label: "02 / SKINCARE",
    title: "Glow Detoxic, anywhere",
    description: "A bright, breezy serum story for everyday radiance.",
    images: ["glow-beach", "glow-howto", "glow-bathroom"],
    query: "Serum",
  },
  {
    label: "03 / ROUTINE",
    title: "Skin Renewing, day to night",
    description: "Daily moisture and nourishment in a rich visual edit.",
    images: ["day-feature", "day-lifestyle", "day-forest-pack"],
    query: "Day Cream",
  },
  {
    label: "04 / EVENING CARE",
    title: "The calm of a night ritual",
    description: "Wrap the day with a comforting night-cream moment.",
    images: ["night-lifestyle", "night-forest-pack", "day-lifestyle"],
    query: "Night Cream",
  },
];
export function ReelEdit() {
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected === null ? null : reels[selected];
  return (
    <>
      <section className="reels-section section-space" id="reels">
        <div className="container">
          <div className="reels-heading">
            <SectionHeading
              kicker="THE ARGANIA REEL EDIT"
              title="Watch it. Love it. Live it."
              description="Mini moments of haircare, skincare and everything in between."
            />
            <span className="reels-note">Editorial previews</span>
          </div>
          <div className="reels-grid">
            {reels.map((reel, index) => (
              <button
                key={reel.title}
                className="reel-card"
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Preview ${reel.title}`}
              >
                <img
                  src={getStorefrontAssetUrl(`assets/${reel.images[0]}.webp`)}
                  alt={reel.description}
                  loading="lazy"
                />
                <span className="reel-gradient" />
                <span className="reel-top">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.6" cy="6.5" r=".7" fill="currentColor" />
                  </svg>{" "}
                  REEL PREVIEW
                </span>
                <span className="reel-play" aria-hidden="true">
                  ▶
                </span>
                <span className="reel-bottom">
                  <small>{reel.label}</small>
                  <strong>{reel.title}</strong>
                  <span>{reel.description} &nbsp; ↗</span>
                </span>
              </button>
            ))}
          </div>
          <div className="reels-foot">
            <span>Behind every ritual is a little story worth sharing.</span>
            <Link href="/products" className="text-link">
              Shop the reel edit ↗
            </Link>
          </div>
        </div>
      </section>
      <ReferenceDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        label="Argania reel preview"
        className="reel-overlay"
      >
        {current && (
          <div className="reel-modal">
            <button
              className="reel-modal-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close reel preview"
            >
              ×
            </button>
            <div className="reel-modal-media">
              <div className="reel-photo-story">
                {current.images.map((image, i) => (
                  <img
                    className={`reel-frame reel-frame-${i + 1}`}
                    key={image}
                    src={getStorefrontAssetUrl(`assets/${image}.webp`)}
                    alt={current.description}
                  />
                ))}
              </div>
              <div className="reel-modal-caption">
                <span>{current.label}</span>
                <h2>{current.title}</h2>
                <p>{current.description}</p>
              </div>
            </div>
            <div className="reel-modal-info">
              <span className="eyebrow">THE ARGANIA REEL EDIT</span>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
              <Link
                href={`/products?q=${encodeURIComponent(current.query)}`}
                className="btn"
                onClick={() => setSelected(null)}
              >
                Shop this ritual ↗
              </Link>
              <button
                className="text-link reel-next"
                type="button"
                onClick={() =>
                  setSelected(((selected ?? 0) + 1) % reels.length)
                }
              >
                Next story ↗
              </button>
            </div>
          </div>
        )}
      </ReferenceDialog>
    </>
  );
}
