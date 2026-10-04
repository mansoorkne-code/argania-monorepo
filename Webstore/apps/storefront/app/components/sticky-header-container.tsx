"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import styles from "./storefront-shell.module.css";

interface StickyHeaderContainerProps {
  children: ReactNode;
}

export function StickyHeaderContainer({ children }: StickyHeaderContainerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 40);

      if (currentScrollY <= 60) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down -> hide header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        // Scrolling up -> reveal header
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`${styles.stickyWrapper} ${
        isVisible ? styles.stickyVisible : styles.stickyHidden
      } ${isScrolled ? styles.stickyScrolled : ""}`}
    >
      {children}
    </div>
  );
}
