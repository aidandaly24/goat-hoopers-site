/** Match a destination and its nested routes without matching a name prefix. */
export function isCurrentRoute(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
