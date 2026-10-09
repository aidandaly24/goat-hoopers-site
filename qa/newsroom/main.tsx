import { createRoot } from "react-dom/client";
import { fixtureArticles } from "./fixtures";
import { Newsroom } from "@/surfaces/news/Newsroom";
import { SiteHeader } from "@/ui/SiteHeader";
import { MobileNav } from "@/ui/MobileNav";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./fixture.css";

const articles = fixtureArticles(new URLSearchParams(location.search).get("state"));
const profile = location.pathname.startsWith("/player/") || location.pathname.startsWith("/teams/");
createRoot(document.getElementById("root")!).render(<>
  <p className="fixture-note">Private QA · synthetic stories, no live league data</p>
  <SiteHeader user={null} logoutAction={async () => {}} />
  <main>{profile ? <div className="fixture-profile"><h1>Synthetic profile destination</h1><a href="/news">Newsroom</a></div> : <Newsroom articles={articles} />}</main>
  <MobileNav user={null} />
</>);
