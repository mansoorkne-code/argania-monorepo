"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./argania-hero.module.css";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";

interface Slide {
  id: number;
  title: string;
  link: string;
  imageDesktop: string;
  imageMobile: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Pure Organic Argan Oil",
    link: "/products",
    imageDesktop: getStorefrontAssetUrl("assets/hero-slider/aloe.webp"),
    imageMobile: getStorefrontAssetUrl("assets/hero-slider/aloe.webp"),
  },
  {
    id: 2,
    title: "Hydrating Serums Collection",
    link: "/products",
    imageDesktop: getStorefrontAssetUrl("assets/hero-slider/serum.webp"),
    imageMobile: getStorefrontAssetUrl("assets/hero-slider/serum.webp"),
  },
  {
    id: 3,
    title: "Luxury Argan Gift Box",
    link: "/products",
    imageDesktop: getStorefrontAssetUrl("assets/hero-slider/day.webp"),
    imageMobile: getStorefrontAssetUrl("assets/hero-slider/day.webp"),
  },
  {
    id: 4,
    title: "Nourishing Hair Care Ritual",
    link: "/products",
    imageDesktop: getStorefrontAssetUrl("assets/hero-slider/spa.webp"),
    imageMobile: getStorefrontAssetUrl("assets/hero-slider/spa.webp"),
  },
];

export function ArganiaHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section 
      aria-label="Argania Hero Banners" 
      className={styles.heroSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.carouselContainer}>
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <Link
              key={slide.id}
              href={slide.link}
              className={`${styles.slide} ${isActive ? styles.activeSlide : ""}`}
              aria-hidden={!isActive}
              aria-label={slide.title}
            >
              <picture className={styles.imageWrapper}>
                <source media="(max-width: 768px)" srcSet={slide.imageMobile} />
                <img
                  src={slide.imageDesktop}
                  alt={slide.title}
                  className={styles.slideImage}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </picture>
            </Link>
          );
        })}

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous Slide"
          className={`${styles.navButton} ${styles.prevButton}`}
          type="button"
        >
          ‹
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next Slide"
          className={`${styles.navButton} ${styles.nextButton}`}
          type="button"
        >
          ›
        </button>

        {/* Pagination Dots */}
        <div className={styles.dotsContainer}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
