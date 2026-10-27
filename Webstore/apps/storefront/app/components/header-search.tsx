"use client";
import { useState } from "react";
import { ReferenceDialog } from "./reference-dialog";
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="icon-button"
        aria-label="Search products"
        title="Search products"
        type="button"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="7" />
          <path d="m16 16 5 5" />
        </svg>
      </button>
      <ReferenceDialog
        open={open}
        onClose={() => setOpen(false)}
        label="Search products"
        className="storefront-search-dialog"
      >
        <div className="search-panel-inner container">
          <button
            className="icon-button search-close"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 5 19 19M19 5 5 19" />
            </svg>
          </button>
          <span className="eyebrow">FIND YOUR NEXT RITUAL</span>
          <form action="/products" onSubmit={() => setOpen(false)}>
            <div className="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="7" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                name="q"
                type="search"
                maxLength={80}
                placeholder="Try ‘keratin’, ‘serum’, ‘toner’…"
                autoComplete="off"
                aria-label="Search products"
              />
            </div>
            <p className="search-hint">
              Start typing to discover something lovely.
            </p>
            <button className="btn" type="submit">
              Search products ↗
            </button>
          </form>
        </div>
      </ReferenceDialog>
    </>
  );
}
