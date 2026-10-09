import { test } from "vitest";
import assert from "node:assert/strict";
import { playerNameMatches, playerSearchKey } from "./player-search";

test("accented and plain spellings share one key, composed and decomposed", () => {
  assert.equal(playerSearchKey("Nikola Jokić"), "nikola jokic");
  // Decomposed ć = c + U+0301; decomposed Š = S + U+0326; decomposed ü = u + U+0308.
  assert.equal(playerSearchKey("Nikola Joki\u0063\u0301"), "nikola jokic");
  assert.equal(playerSearchKey("Nikola Jokić".normalize("NFD")), "nikola jokic");
  assert.equal(playerSearchKey("Luka Dončić"), "luka doncic");
  assert.equal(playerSearchKey("Luka Dončić".normalize("NFD")), "luka doncic");
  assert.equal(playerSearchKey("Alperen Şengün"), "alperen sengun");
  assert.equal(playerSearchKey("Alperen Şengün".normalize("NFD")), "alperen sengun");
  assert.equal(playerSearchKey("NIKOLA JOKIĆ"), "nikola jokic");
});

test("straight, curly and absent apostrophes collide", () => {
  assert.equal(playerSearchKey("Day'Ron Sharpe"), "dayron sharpe");
  assert.equal(playerSearchKey("Day\u2019Ron Sharpe"), "dayron sharpe");
  assert.equal(playerSearchKey("Dayron Sharpe"), "dayron sharpe");
});

test("periods are removed; hyphens become separators; whitespace collapses", () => {
  assert.equal(playerSearchKey("J.R. Smith"), "jr smith");
  assert.equal(playerSearchKey("Jean-Charles"), "jean charles");
  assert.equal(playerSearchKey("Jean–Charles"), "jean charles");
  assert.equal(playerSearchKey("  LeBron   James  "), "lebron james");
});

test("plain queries match accented display names", () => {
  assert.equal(playerNameMatches("Nikola Jokić", "jokic"), true);
  assert.equal(playerNameMatches("Nikola Jokić", "JOKIC"), true);
  assert.equal(playerNameMatches("Nikola Jokić", "  jokic  "), true);
  assert.equal(playerNameMatches("Luka Dončić", "doncic"), true);
  assert.equal(playerNameMatches("Alperen Şengün", "sengun"), true);
  assert.equal(playerNameMatches("Day'Ron Sharpe", "dayron"), true);
  assert.equal(playerNameMatches("Day\u2019Ron Sharpe", "day'ron"), true);
  assert.equal(playerNameMatches("Day'Ron Sharpe", "day\u2019ron"), true);
  assert.equal(playerNameMatches("Nikola Jokić", "lebron"), false);
});

test("blank or whitespace-only queries keep current board behavior", () => {
  assert.equal(playerSearchKey(""), "");
  assert.equal(playerSearchKey("   "), "");
  assert.equal(playerNameMatches("Nikola Jokić", ""), true);
  assert.equal(playerNameMatches("Nikola Jokić", "   "), true);
});

test("punctuation or combining-mark-only queries match nothing, never everything", () => {
  assert.equal(playerSearchKey("..."), "");
  assert.equal(playerSearchKey("'''"), "");
  assert.equal(playerSearchKey("\u2019"), "");
  assert.equal(playerSearchKey("\u0301\u0301\u0301"), "");
  assert.equal(playerNameMatches("Nikola Jokić", "..."), false);
  assert.equal(playerNameMatches("Nikola Jokić", "'"), false);
  assert.equal(playerNameMatches("Nikola Jokić", "\u2019"), false);
  assert.equal(playerNameMatches("Nikola Jokić", "\u0301\u0301\u0301"), false);
  assert.equal(playerNameMatches("Nikola Jokić", " - "), false);
});

test("non-Latin input never throws and keeps its letters", () => {
  assert.doesNotThrow(() => playerSearchKey("姚明"));
  assert.equal(playerSearchKey("姚明"), "姚明");
  assert.equal(playerNameMatches("姚明", "姚"), true);
  assert.equal(playerNameMatches("Nikola Jokić", "姚"), false);
  assert.equal(playerNameMatches("姚明", "jokic"), false);
});
