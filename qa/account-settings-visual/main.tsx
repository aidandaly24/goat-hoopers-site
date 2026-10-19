import React from "react";
import { createRoot } from "react-dom/client";
import AccountPage from "../../src/app/account/page";
import TeamRoute from "../../src/app/team/page";
import PasswordPage from "../../src/app/account/password/page";
import EmailLoginPage from "../../src/app/account/login/page";
import AppError from "../../src/app/error";
import Loading from "../../src/app/loading";
import { SiteHeader } from "../../src/ui/SiteHeader";
import { SiteFooter } from "../../src/ui/SiteFooter";
import { getProviderUser, fixtureState } from "./mocks";
import { AccountForm } from "../../src/surfaces/accounts/AccountForm";
import "../../src/ui/tokens.css";
import "../../src/app/globals.css";
import "./fixture.css";

async function mount() {
  const query = new URL(window.location.href).searchParams;
  const theme = query.get("theme") === "dark" ? "dark" : "light";
  localStorage.setItem("goat-hoopers.theme", theme);
  document.documentElement.dataset.theme = theme;
  let content: React.ReactNode;
  try {
    const searchParams = Promise.resolve({ next: query.get("next") ?? undefined });
    const mode = query.get("mode") as React.ComponentProps<typeof AccountForm>["mode"];
    content = window.location.pathname === "/fixture/form" ? <AccountForm mode={mode} token="synthetic-unused-token" teams={[{ id: "3", name: "Fixture Hoopers" }]} /> : fixtureState() === "loading" ? <Loading /> : window.location.pathname === "/team" ? await TeamRoute() : window.location.pathname === "/account/password" ? await PasswordPage() : window.location.pathname === "/account/login" ? await EmailLoginPage({ searchParams }) : await AccountPage({ searchParams });
  } catch (error) {
    const failure = error as Error & { fixtureRedirect?: string };
    content = failure.fixtureRedirect ? <p data-fixture-redirect={failure.fixtureRedirect}>Synthetic route redirect: {failure.fixtureRedirect}</p> : <AppError error={failure} reset={() => window.location.reload()} />;
  }
  const member = fixtureState() === "error" ? null : await getProviderUser();
  createRoot(document.getElementById("root")!).render(<>
    <SiteHeader user={member ? { displayName: member.displayName, teamId: member.teamId } : null} logoutAction={async () => {}} />
    <main id="main-content" tabIndex={-1}>{content}</main>
    <SiteFooter season={null} />
  </>);
  document.documentElement.dataset.fixtureReady = "true";
}
void mount();
