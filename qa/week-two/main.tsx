import { createRoot } from "react-dom/client";
import { WeekTwoDraft } from "@/surfaces/arcade/week-two/WeekTwoDraft";
import { getWeekTwoDemo } from "@/data/week-two-demo";
import { SiteHeader } from "@/ui/SiteHeader";
import { SITE_DESTINATIONS } from "@/ui/siteDestinations";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./review.css";

// Browser fixture of the real surface + header. No root data/auth/ticker loaders.
createRoot(document.getElementById("root")!).render(<>
  <SiteHeader user={null} destinations={SITE_DESTINATIONS} logoutAction={async () => { throw new Error("No auth in the design fixture"); }} />
  <main id="main-content" tabIndex={-1}><WeekTwoDraft demo={getWeekTwoDemo()} /></main>
</>);
