"use client";
import { useState } from "react";
import Link from "next/link";
import { ReferenceDialog } from "./reference-dialog";
import { getStorefrontAssetUrl } from "../../lib/storefront-assets";
const guidance = [
  {
    name: "Haircare",
    query: "hair",
    text: "Start with a shampoo, follow with conditioner, and explore a treatment for your wash-day ritual.",
  },
  {
    name: "Skincare",
    query: "skin",
    text: "Keep your routine simple: cleanse, moisturise, and choose the care that suits your skin.",
  },
  {
    name: "Serum",
    query: "serum",
    text: "Explore the Argania serum collection and follow each product's directions for your routine.",
  },
];
export function StorefrontWidgets() {
  const [support, setSupport] = useState(false),
    [beauty, setBeauty] = useState(false),
    [spin, setSpin] = useState(false);
  const [topic, setTopic] = useState("product"),
    [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "Hi there! ✨ What would you like to explore? Choose a routine below, or ask about haircare, skincare or serum.",
  );
  const [result, setResult] = useState<string | null>(null),
    [rotation, setRotation] = useState(0);
  const advise = (text: string) => {
    const match = guidance.find((item) =>
      text.toLowerCase().includes(item.query),
    );
    setAnswer(
      match?.text ??
        "Explore our haircare, skincare and body-care collections. For help choosing a product or checking an order, email the Argania team.",
    );
    setQuestion("");
  };
  return (
    <>
      <div
        className="whatsapp-widget"
        onKeyDown={(event) => {
          if (event.key === "Escape") setSupport(false);
        }}
      >
        {support && (
          <section
            className="whatsapp-panel"
            id="whatsapp-panel"
            aria-label="Argania Support"
          >
            <div className="whatsapp-panel-head">
              <div className="wa-avatar">
                <img
                  src={getStorefrontAssetUrl("assets/favicon.webp")}
                  alt="Argania logo"
                />
              </div>
              <div>
                <strong>Argania Support</strong>
                <small>Beauty questions? We&apos;re here to help.</small>
              </div>
              <button
                className="wa-close"
                type="button"
                onClick={() => setSupport(false)}
                aria-label="Close support options"
              >
                ×
              </button>
            </div>
            <div className="wa-panel-body">
              <p>Hi there! ✨ How can we help with your Argania routine?</p>
              <label htmlFor="support-topic">Choose a topic</label>
              <select
                id="support-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                <option value="product">Product advice</option>
                <option value="order">Order enquiry</option>
                <option value="collaboration">Collaboration</option>
              </select>
              <a
                className="wa-send"
                href={`mailto:argania.professional@gmail.com?subject=${encodeURIComponent(topic === "order" ? "Order enquiry" : topic === "collaboration" ? "Collaboration" : "Product advice")}`}
              >
                Contact Argania <span>↗</span>
              </a>
              <a
                className="wa-email"
                href="mailto:argania.professional@gmail.com"
              >
                Email our team ↗
              </a>
            </div>
          </section>
        )}
        <button
          className="whatsapp-fab"
          type="button"
          aria-label="Chat with Argania"
          aria-expanded={support}
          aria-controls="whatsapp-panel"
          onClick={() => {
            setSupport(!support);
            setBeauty(false);
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 3C8.82 3 3 8.82 3 16c0 2.34.62 4.52 1.71 6.42L3 29l6.77-1.77A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.03 0-4.02-.55-5.73-1.6l-.4-.24-4.02 1.05 1.08-3.92-.27-.41A10.76 10.76 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8zm5.94-8.1c-.32-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.73.16-.22.32-.84 1.06-1.03 1.28-.19.21-.38.24-.7.08-.33-.16-1.38-.51-2.63-1.62-.97-.86-1.62-1.92-1.8-2.24-.2-.32-.02-.49.14-.65.15-.14.32-.38.49-.56.16-.19.21-.32.32-.53.11-.22.06-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.63c-.22 0-.57.08-.87.41s-1.14 1.11-1.14 2.72 1.17 3.17 1.33 3.39c.16.21 2.29 3.5 5.56 4.9.78.34 1.39.54 1.87.69.79.25 1.51.21 2.08.13.64-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.13-.3-.21-.62-.37z"
            />
          </svg>
          <span>Chat with us</span>
        </button>
      </div>
      <button
        className="spin-launch"
        type="button"
        aria-haspopup="dialog"
        aria-controls="spin-preview"
        onClick={() => setSpin(true)}
      >
        <span className="spin-launch-icon" aria-hidden="true">
          ✳
        </span>
        <span>Spin &amp; Save</span>
      </button>
      <ReferenceDialog
        open={spin}
        onClose={() => setSpin(false)}
        label="Spin for a surprise"
        className="spin-overlay"
      >
        <section className="spin-modal" id="spin-preview">
          <button
            className="spin-close"
            type="button"
            onClick={() => setSpin(false)}
            aria-label="Close spin wheel"
          >
            ×
          </button>
          <div className="spin-details">
            <span className="eyebrow">A LITTLE TREAT, FROM ARGANIA</span>
            <h2>Spin for a surprise.</h2>
            <p>
              Try your luck for 10%, 20%, or 35% off—or better luck next time.
              Four equally likely outcomes.
            </p>
            <div className="spin-benefit">
              <span>✧</span>
              <span>
                Design preview only. Results do not apply a checkout discount.
              </span>
            </div>
            <div className="spin-result" role="status">
              {result ?? "Ready when you are."}
            </div>
            <button
              className="btn spin-action"
              type="button"
              disabled={result !== null}
              onClick={() => {
                const outcome = Math.floor(Math.random() * 4);
                setRotation(1440 - outcome * 90);
                setResult(
                  [
                    "Preview reward: 10% off",
                    "Preview reward: 20% off",
                    "Preview reward: 35% off",
                    "Better luck next time",
                  ][outcome]!,
                );
              }}
            >
              SPIN THE WHEEL <span>↗</span>
            </button>
            {result && (
              <Link
                className="spin-shop"
                href="/products"
                onClick={() => setSpin(false)}
              >
                Browse the collection ↗
              </Link>
            )}
          </div>
          <div className="spin-visual">
            <span className="spin-pointer" aria-hidden="true" />
            <div
              className="spin-disc"
              style={{ transform: `rotate(${rotation}deg)` }}
              aria-label="Four preview rewards"
            >
              <div className="spin-segment-label spin-segment-top">
                <strong>10%</strong>
                <small>OFF</small>
              </div>
              <div className="spin-segment-label spin-segment-right">
                <strong>20%</strong>
                <small>OFF</small>
              </div>
              <div className="spin-segment-label spin-segment-bottom">
                <strong>35%</strong>
                <small>OFF</small>
              </div>
              <div className="spin-segment-label spin-segment-left">
                <strong>
                  BETTER
                  <br />
                  LUCK
                </strong>
                <small>NEXT TIME</small>
              </div>
              <span className="spin-hub" aria-hidden="true">
                A
              </span>
            </div>
            <p className="spin-underwheel">YOUR BEAUTY. YOUR LUCK.</p>
          </div>
        </section>
      </ReferenceDialog>
      <div
        className="beauty-chat-widget"
        onKeyDown={(event) => {
          if (event.key === "Escape") setBeauty(false);
        }}
      >
        {beauty && (
          <section
            className="beauty-chat-panel"
            id="beauty-chat-panel"
            role="region"
            aria-label="Argania beauty assistant"
          >
            <div className="beauty-chat-head">
              <div className="beauty-chat-avatar">
                A<span>✧</span>
              </div>
              <div>
                <strong>Argania Beauty Assistant</strong>
                <small>Instant routine guidance</small>
              </div>
              <button
                type="button"
                onClick={() => setBeauty(false)}
                aria-label="Close beauty assistant"
              >
                ×
              </button>
            </div>
            <div className="beauty-chat-messages" role="log" aria-live="polite">
              <div className="beauty-chat-message assistant"><div className="beauty-chat-bubble">{answer}</div></div>
            </div>
            <div className="beauty-chat-quick">
              {guidance.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => advise(item.name)}
                >
                  {item.name}
                </button>
              ))}
              <Link href="/products">Shop all ↗</Link>
            </div>
            <form
              className="beauty-chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                advise(question);
              }}
            >
              <label className="sr-only" htmlFor="beauty-chat-input">
                Ask about Argania products
              </label>
              <input
                id="beauty-chat-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about a product or routine…"
                maxLength={400}
                required
              />
              <button type="submit" aria-label="Send message">
                ➤
              </button>
            </form>
            <div className="beauty-chat-disclaimer">
              General routine guidance. For products and orders, contact
              Argania.
            </div>
          </section>
        )}
        <button
          className="beauty-chat-fab"
          aria-label="Beauty Assistant"
          type="button"
          aria-expanded={beauty}
          aria-controls="beauty-chat-panel"
          onClick={() => {
            setBeauty(!beauty);
            setSupport(false);
          }}
        >
          <span className="beauty-chat-spark" aria-hidden="true">
            ✦
          </span>
          <span>Beauty Assistant</span>
        </button>
      </div>
    </>
  );
}
