import type { SiteHeaderUser } from "./SiteHeader";

/** Compatibility for existing isolated surface reviews. Root-owned SiteHeader
 * now supplies phone navigation; this former bar emits no markup.
 * Owners may remove old call sites when next updating those fixtures. */
export function MobileNav(props: { user: SiteHeaderUser }) {
  void props;
  return null;
}
