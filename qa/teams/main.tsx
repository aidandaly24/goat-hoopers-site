import { createRoot } from "react-dom/client";
import Link from "next/link";
import { TeamDirectory } from "@/surfaces/teams/TeamDirectory";
import { directoryTeams } from "./fixtures";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./fixture.css";

const params = new URLSearchParams(location.search);
const baselinePath = "/.baseline/TeamDirectory.tsx";
const Surface: typeof TeamDirectory = params.get("variant") === "before"
  ? (await import(/* @vite-ignore */ baselinePath)).TeamDirectory : TeamDirectory;
let teams = directoryTeams;
if (params.get("state") === "empty") teams = [];
if (params.get("state") === "long") teams = directoryTeams.map(t => ({ ...t,
  name: `${t.name} ${"AnExtraordinarilyLongUnbrokenTeamName".repeat(3)}`,
  managerName: `${t.managerName} ${"AnExtraordinarilyLongUnbrokenManagerName".repeat(2)}`,
}));
const profile = /^\/teams\/[^/]+$/.test(location.pathname);
createRoot(document.getElementById("root")!).render(<>
  <p className="fixture-note">Private QA · synthetic managers and results</p>
  <main>{profile ? <><h1>Fixture profile {location.pathname.split("/").at(-1)}</h1><Link href="/teams">Teams</Link></>
    : <Surface teams={teams} />}</main>
</>);
