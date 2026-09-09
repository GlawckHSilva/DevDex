import type { AnchorHTMLAttributes } from "react";

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function AppLink({ children, ...props }: AppLinkProps) {
  return <a {...props}>{children}</a>;
}
