"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { teamColorVar } from "./teamColors";
import { isCurrentRoute } from "./currentRoute";
import { SiteChrome } from "./SiteChrome";
import { SITE_DESTINATIONS, type SiteDestination } from "./siteDestinations";
import styles from "./SiteHeader.module.css";
import { ThemeToggle } from "./ThemeToggle";
import { ThemedLogo } from "./ThemedLogo";

export type SiteHeaderUser = {
  displayName: string;
  teamId: string;
  /** Sleeper avatar id of the member's team owner; null when Sleeper has none. */
  avatar: string | null;
} | null;
type Disclosure = { kind: "menu" | "league"; pathname: string };
type Props = {
  user: SiteHeaderUser;
  /** Injected server action; this primitive never imports the app's auth. */
  logoutAction: () => Promise<void>;
  destinations?: readonly SiteDestination[];
  /** Server-rendered ticker slot. Its data/poller ownership is unchanged. */
  ticker?: ReactNode;
};

/** Root-composed navigation. Only compact ticker/toolbar is sticky; expanded
 * disclosures remain in page flow and use ordinary links, without a focus trap.
 * Phone Stocks is a persistent shortcut, omitted from Menu to avoid a duplicate.
 */
export function SiteHeader({ user, logoutAction, destinations = SITE_DESTINATIONS, ticker }: Props) {
  const pathname = usePathname();
  const [disclosure, setDisclosure] = useState<Disclosure | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const leagueRef = useRef<HTMLButtonElement>(null);
  // Reset route-local UI during rendering, before Back can expose an old menu.
  if (disclosure && disclosure.pathname !== pathname) setDisclosure(null);
  const open = disclosure?.pathname === pathname ? disclosure.kind : null;
  const primary = destinations.filter(d => d.group === "primary");
  const league = destinations.filter(d => d.group === "league");
  const account = destinations.filter(d => d.group === "account");
  const active = destinations.find(d => isCurrentRoute(pathname, d.href));
  const current = (href: string) => isCurrentRoute(pathname, href) ? "page" as const : undefined;
  const close = () => setDisclosure(null);
  const toggle = (kind: Disclosure["kind"]) => setDisclosure(open === kind ? null : { kind, pathname });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 40rem)");
    // Hiding a focused control can reset activeElement to body before the
    // media event. Remember navigation focus until the user moves elsewhere.
    let navigationFocus: HTMLElement | null = null;
    const inside = (node: Node | null) => headerRef.current?.contains(node) || panelRef.current?.contains(node);
    const focusedIn = (event: FocusEvent) => {
      navigationFocus = event.target instanceof HTMLElement && inside(event.target) ? event.target : null;
    };
    const pointedOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !inside(event.target)) navigationFocus = null;
    };
    const changed = () => {
      const focused = document.activeElement === document.body ? navigationFocus : document.activeElement;
      const focusedInPanel = panelRef.current?.contains(focused);
      const hiddenHeaderControl = focused instanceof HTMLElement && headerRef.current?.contains(focused) && focused.getClientRects().length === 0;
      navigationFocus = null;
      setDisclosure(null);
      if (focusedInPanel || hiddenHeaderControl) {
        const stocks = [...(headerRef.current?.querySelectorAll<HTMLAnchorElement>('a[href="/stocks"]') ?? [])]
          .find(link => link.getBoundingClientRect().width > 0);
        stocks?.focus({ preventScroll: true });
      }
    };
    media.addEventListener("change", changed);
    document.addEventListener("focusin", focusedIn);
    document.addEventListener("pointerdown", pointedOutside);
    return () => {
      media.removeEventListener("change", changed);
      document.removeEventListener("focusin", focusedIn);
      document.removeEventListener("pointerdown", pointedOutside);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = open === "menu" ? menuRef.current : leagueRef.current;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: "start" });
      trigger?.focus({ preventScroll: true });
    });
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // A nonmodal disclosure must defer to existing inspectors/native readers.
      if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('dialog[open], [aria-modal="true"]'))) return;
      event.preventDefault();
      setDisclosure(null);
      trigger?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", escape); };
  }, [open]);

  const activated = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified links may open another tab without changing this route.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const href = event.currentTarget.getAttribute("href");
    close();
    if (open && pathname === href) (open === "menu" ? menuRef.current : leagueRef.current)?.focus({ preventScroll: true });
  };
  const links = (items: readonly SiteDestination[]) => items.map(d => (
    <Link key={d.href} href={d.href} aria-current={current(d.href)} onClick={activated}>{d.label}</Link>
  ));
  const accountActions = <>
    {user ? <>
      <Link href="/team" className={styles.displayName} aria-current={current("/team")} onClick={activated}
        style={{ "--gh-ring": teamColorVar(user.teamId) } as CSSProperties}>
        <AccountAvatar displayName={user.displayName} avatar={user.avatar} />
        <span className={styles.name}>{user.displayName}</span>
      </Link>
      <form action={logoutAction} className={styles.logoutForm}><button type="submit" className={styles.logout}>Log out</button></form>
    </> : <>
      <Link href="/claim" className={styles.claim} aria-current={current("/claim")} onClick={activated}>Claim team</Link>
      <Link href="/login" className={styles.login} aria-current={current("/login")} onClick={activated}>Log in</Link>
    </>}
  </>;

  return <>
    <SiteChrome>
      {ticker}
      <header ref={headerRef} className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.wordmark} aria-label="GOAT Hoopers home" onClick={activated}>
            <ThemedLogo />
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            {links(primary)}
            <button ref={leagueRef} type="button" className={styles.disclosure}
              aria-expanded={open === "league"} aria-controls="site-navigation-panel"
              aria-label={"League tools" + (active?.group === "league" ? ", current: " + active.label : "")}
              data-current={active?.group === "league" || undefined} onClick={() => toggle("league")}>
              League tools <span aria-hidden="true">{open === "league" ? "−" : "+"}</span>
            </button>
            {!user && links(account)}
          </nav>
          <nav className={styles.compactNav} aria-label="Primary">
                        <button ref={menuRef} type="button" className={styles.disclosure}
              aria-expanded={open === "menu"} aria-controls="site-navigation-panel"
              aria-label={"Menu" + (active ? ", current: " + active.label : "")}
              onClick={() => toggle("menu")}>Menu <span aria-hidden="true">{open === "menu" ? "−" : "+"}</span></button>
          </nav>
          <div className={styles.account}>{accountActions}</div>
          <ThemeToggle />
        </div>
      </header>
    </SiteChrome>
    <div ref={panelRef} id="site-navigation-panel" className={styles.panel} hidden={!open} data-kind={open}>
      {open === "menu" && <nav className={styles.panelLinks} aria-label="More destinations">{links(primary)}</nav>}
      <nav className={styles.panelLinks} aria-label="League tools"><h2 className={styles.panelTitle}>League tools</h2>{links(league)}</nav>
      {open === "menu" && <div className={styles.panelAccount}>
        {!user && links(account)}{accountActions}
      </div>}
    </div>
  </>;
}

/** The load state of an <img>, reduced to what the fallback decision needs. */
export type ImageLoadState = { complete: boolean; naturalWidth: number };

/**
 * True when an image has already finished loading — and failed. An
 * avatar served in the SSR HTML can 404 before hydration attaches the
 * error handler; that error event fires exactly once and React never
 * sees it, but the settled state stays readable on the element
 * (complete with zero natural width). A still-loading image
 * (complete === false) is NOT failed: it may yet succeed, and a later
 * failure is caught by onError.
 */
export function imageAlreadyFailed(img: ImageLoadState): boolean {
  return img.complete && img.naturalWidth === 0;
}

/**
 * The account chip's face: the member's Sleeper avatar inside the
 * team-colored ring when their Sleeper identity has one, the initial
 * disc otherwise. A failed image load falls back to the initials — a
 * broken-image icon must never sit in the header. The failed id (not a
 * bare boolean) is remembered, so if the signed-in identity changes
 * without a remount, the new member's avatar still gets its chance.
 */
function AccountAvatar({ displayName, avatar }: { displayName: string; avatar: string | null }) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const showImage = avatar !== null && failedAvatar !== avatar;

  // onError alone misses an avatar that failed before hydration (see
  // imageAlreadyFailed). When the client attaches — on mount and
  // whenever the avatar id changes — inspect the rendered image and
  // route an already-failed one through the same failed-id fallback.
  useEffect(() => {
    if (!showImage || avatar === null) return;
    const img = imgRef.current;
    if (img && imageAlreadyFailed(img)) setFailedAvatar(avatar);
  }, [avatar, showImage]);

  return (
    <span className={styles.ring} aria-hidden="true">
      {showImage ? (
        <img
          ref={imgRef}
          className={styles.avatarImg}
          src={`https://sleepercdn.com/avatars/thumbs/${avatar}`}
          alt=""
          onError={() => setFailedAvatar(avatar)}
        />
      ) : (
        initials(displayName)
      )}
    </span>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase();
}
