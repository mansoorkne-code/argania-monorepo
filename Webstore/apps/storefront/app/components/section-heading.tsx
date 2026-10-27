import Link from "next/link";
export function SectionHeading({
  kicker,
  title,
  description,
  href,
  linkText,
  centered = false,
}: {
  kicker: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  centered?: boolean;
}) {
  return (
    <div className={`section-heading${centered ? " centered" : ""}`}>
      <div>
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkText} &nbsp;↗
        </Link>
      )}
    </div>
  );
}
