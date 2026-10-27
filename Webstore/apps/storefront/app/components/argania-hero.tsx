"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
const slides = [
  {
    file: "aloe",
    name: "Aloe Vera Gel",
    kind: "SKINCARE",
    action: "Explore Aloe Vera Gel",
    query: "Aloe",
    alt: "Argania Professional Aloe Vera Gel botanical skincare banner",
  },
  {
    file: "night",
    name: "Intensive Night Cream",
    kind: "NIGHT CARE",
    action: "Shop Night Cream",
    query: "Night Cream",
    alt: "Argania Professional Intensive Night Cream campaign in a lavender evening setting",
  },
  {
    file: "day",
    name: "Skin Renewing Day Cream",
    kind: "DAY CARE",
    action: "Shop Day Cream",
    query: "Day Cream",
    alt: "Argania Professional Skin Renewing Day Cream campaign with pomegranate",
  },
  {
    file: "dtan",
    name: "D-Tan Treatment",
    kind: "SKINCARE",
    action: "Explore Skincare",
    query: "D-Tan",
    alt: "Argania Professional D-Tan treatment skincare campaign",
  },
  {
    file: "spa",
    name: "Instant Repair Hair Spa",
    kind: "HAIRCARE",
    action: "Shop Hair Spa",
    query: "Hair Spa",
    alt: "Argania Professional salon-like Hair Spa campaign",
  },
  {
    file: "serum",
    name: "Glow Detoxic One Tone Serum",
    kind: "SERUM",
    action: "Shop Glow Detoxic",
    query: "Serum",
    alt: "Argania Professional Glow Detoxic serum beach skincare campaign",
  },
];
const href = (query: string) => `/products?q=${encodeURIComponent(query)}`;
export function ArganiaHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const touch = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      if (!paused && !media.matches && !document.hidden)
        timer = setInterval(
          () => setIndex((current) => (current + 1) % slides.length),
          6000,
        );
    };
    update();
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
    };
  }, [paused, index]);
  const change = (target: number) => {
    const next = (target + slides.length) % slides.length;
    setIndex(next);
    setAnnouncement(
      `Banner ${next + 1} of ${slides.length}: ${slides[next]!.name}`,
    );
  };
  const current = slides[index]!;
  return (
    <section
      className="ap-hero-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Argania featured campaigns"
      tabIndex={-1}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          change(index + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
      onTouchStart={(event) => {
        touch.current = [event.touches[0]!.clientX, event.touches[0]!.clientY];
      }}
      onTouchEnd={(event) => {
        const point = event.changedTouches[0];
        if (!point) return;
        const dx = point.clientX - touch.current[0],
          dy = point.clientY - touch.current[1];
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2)
          change(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="ap-hero-stage">
        {slides.map((slide, i) => (
          <Link
            key={slide.file}
            href={href(slide.query)}
            className={`ap-hero-slide${i === index ? " is-active" : ""}`}
            aria-label={slide.action}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            <img
              src={getStorefrontAssetUrl(
                `assets/hero-slider/${slide.file}.webp`,
              )}
              alt={slide.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
            />
          </Link>
        ))}
        <button
          className="ap-hero-arrow ap-hero-prev"
          type="button"
          aria-label="Previous banner"
          onClick={() => change(index - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <button
          className="ap-hero-arrow ap-hero-next"
          type="button"
          aria-label="Next banner"
          onClick={() => change(index + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="ap-hero-bar">
        <div className="ap-hero-label">
          <span className="ap-hero-eyebrow">{current.kind} · FEATURED</span>
          <strong>{current.name}</strong>
        </div>
        <div
          className="ap-hero-dots"
          role="group"
          aria-label="Choose hero banner"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.file}
              className={`ap-hero-dot${i === index ? " is-active" : ""}`}
              type="button"
              aria-label={`Show banner ${i + 1}: ${slide.name}`}
              aria-pressed={i === index}
              onClick={() => change(i)}
            >
              <span />
            </button>
          ))}
        </div>
        <Link className="ap-hero-shop" href={href(current.query)}>
          {current.action} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
