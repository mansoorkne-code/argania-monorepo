export function NewsletterForm({
  id,
  footer = false,
}: {
  id: string;
  footer?: boolean;
}) {
  return (
    <form
      action="mailto:argania.professional@gmail.com"
      method="get"
      className="newsletter-form"
    >
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        name="body"
        type="email"
        placeholder={footer ? "Your email address" : "Enter your email"}
        required
      />
      <button
        type="submit"
        className={footer ? undefined : "btn"}
        aria-label={footer ? "Join the newsletter" : undefined}
      >
        {footer ? (
          <>
            Join us <span>↗</span>
          </>
        ) : (
          <>Subscribe ↗</>
        )}
      </button>
      {footer && <small>Opens your email app to request updates.</small>}
    </form>
  );
}
