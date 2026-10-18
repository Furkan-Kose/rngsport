import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router";
import { useLocalizedPath } from "../lib/localePath";

// react-router Link'in dil önekli hali: to="/sepet" → İngilizcede /en/sepet
const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => {
  const localize = useLocalizedPath();
  return <Link ref={ref} to={typeof to === "string" ? localize(to) : to} {...props} />;
});
LocalizedLink.displayName = "LocalizedLink";

export default LocalizedLink;
