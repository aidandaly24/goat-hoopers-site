import { expect, test } from "vitest";
import { loginContinuationHref, safeLoginDestination } from "./login-navigation";

test.each([undefined, null, ["/team"], "", "https://example.test", "//example.test", "/\\example.test", "javascript:alert(1)", "/%2f%2fexample.test", "/%255cexample.test", "/team\n", "/login", "/account/login?next=/team", "/account/continue", "/api/auth/sign-out", "/_next/static", "/x/../login", "/%256cogin", "/x%2f..%2flogin", "/%GG"])("rejects unsafe or looping destination %j", value => {
  expect(safeLoginDestination(value)).toBe("/");
  expect(loginContinuationHref(value)).toBe("/account/continue");
});

test.each(["/team", "/account", "/account/password", "/stocks?player=123#history", "/teams/3", "/arcade/free-throw"])("retains intentional in-app return %s", value => {
  expect(safeLoginDestination(value)).toBe(value);
  expect(loginContinuationHref(value)).toBe(`/account/continue?next=${encodeURIComponent(value)}`);
});

test("ordinary sign-in has one canonical home destination", () => {
  expect(safeLoginDestination(undefined)).toBe("/");
  expect(loginContinuationHref("/")).toBe("/account/continue");
});
