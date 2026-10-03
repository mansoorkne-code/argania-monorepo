import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={["ui-card", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={["ui-card__header", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h2 className={["ui-card__title", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </h2>
  );
}

function CardDescription({ className, children, ...props }: CardProps) {
  return (
    <p className={["ui-card__description", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={["ui-card__content", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div className={["ui-card__footer", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
