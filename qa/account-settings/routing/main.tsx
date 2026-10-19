import React from "react";
import { createRoot } from "react-dom/client";
import { AccountForm } from "../../../src/surfaces/accounts/AccountForm";
import "../../../src/ui/tokens.css";
import "../../../src/app/globals.css";
const url = new URL(window.location.href);
createRoot(document.getElementById("root")!).render(<AccountForm mode={url.pathname === "/account" ? "claim" : "login"} returnTo={url.searchParams.get("next") ?? "/"} />);
