import type { SVGProps } from "react";

type IconName =
  "arrow" | "bag" | "check" | "close" | "leaf" | "shield" | "truck" | "zoom";

export function ProductIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    leaf: (
      <>
        <path d="M20 4C9 2 3 8 5 15s13 5 15-11Z" />
        <path d="M4 21 16 9" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    zoom: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5M7.5 10.5h6M10.5 7.5v6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
