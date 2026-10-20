import { describe, expect, test } from "vitest";
import samples from "../../../data/team-history-audit/samples.json";
import scoring from "../../../data/team-history-audit/scoring.json";
import candidates from "../../../data/team-history-audit/identity-candidates.json";
import existing from "../espn-id-map.json";
import { auditTeamHistoryBoxScore, gameInputsPrecede, type BoxScoreAuditEvent } from "../team-history-boxscore-audit";

const events = samples.events as BoxScoreAuditEvent[];
const identities = Object.entries(existing).map(([sleeperId, espnId]) => ({ sleeperId, espnId }));
const options = { scoring: scoring.scoring, existingIdentities: identities, candidateIdentities: candidates.candidates };
const run = (event: BoxScoreAuditEvent) => auditTeamHistoryBoxScore(event, options);
const event = (id: string) => structuredClone(events.find(row => row.id === id)!);

describe("frozen historical box-score feasibility audit", () => {
  test("retains every source athlete without treating DNP or current active status as a game", () => {
    const rows = events.flatMap(run), played = rows.filter(row => row.participation === "played");
    expect(rows).toHaveLength(109);
    expect(played).toHaveLength(78);
    expect(rows.filter(row => row.participation === "dnp")).toHaveLength(31);
    expect(rows.filter(row => row.participation === "dnp").every(row => row.fantasyPoints === null)).toBe(true);
    // Source says active=false and reason=COACH'S DECISION for this played row.
    expect(rows.find(row => row.espnId === "4701992")).toMatchObject({ name: "Max Shulga", participation: "played", fantasyPoints: 6 });
  });

  test("reports mapping candidates separately and never activates a name-based production mapping", () => {
    const played = events.flatMap(run).filter(row => row.participation === "played");
    expect(played.filter(row => row.existingSleeperId !== null)).toHaveLength(75);
    const unresolved = played.filter(row => row.existingSleeperId === null);
    expect(unresolved.map(row => [row.name, row.candidateSleeperId])).toEqual([
      ["Gabe Vincent", "2084"], ["Max Shulga", "4785"], ["Dalano Banton", "2290"],
    ]);
    expect(unresolved.every(row => !row.eligibleWithExistingMap)).toBe(true);
    expect(existing).not.toHaveProperty("4785");
  });

  test("scores structured technical/flagrant offenders and never their free-throw shooter", () => {
    const rows = run(event("401809244"));
    expect(rows.find(row => row.name === "Draymond Green")).toMatchObject({ fantasyPoints: 20.5, statistics: { tf: 1, ff: 0 } });
    expect(rows.find(row => row.name === "Jarred Vanderbilt")).toMatchObject({ fantasyPoints: 1, statistics: { tf: 1, ff: 0 } });
    expect(rows.find(row => row.name === "Marcus Smart")).toMatchObject({ fantasyPoints: 1.5, statistics: { tf: 0, ff: 1 } });
    expect(rows.find(row => row.name === "Stephen Curry")).toMatchObject({ statistics: { tf: 0, ff: 0 } });
  });

  test("an unattributed coach technical stays unknown for that team rather than silently scoring zero", () => {
    const rows = run(event("401810468"));
    const team = rows.filter(row => row.teamId === "20" && row.participation === "played");
    expect(team).toHaveLength(10);
    expect(team.every(row => row.fantasyPoints === null && row.missingScoring.join() === "tf")).toBe(true);
    expect(team.find(row => row.name === "Tyrese Maxey")).toMatchObject({ knownFantasyPoints: 26, fantasyPoints: null });
    expect(rows.filter(row => row.teamId === "21" && row.participation === "played").every(row => row.fantasyPoints !== null)).toBe(true);
    const all = events.flatMap(run).filter(row => row.participation === "played");
    expect(all.filter(row => row.fantasyPoints !== null)).toHaveLength(68);
    expect(all.filter(row => row.eligibleWithExistingMap)).toHaveLength(65);
  });

  test("derives per-game stacked achievement flags from the full five-category evidence", () => {
    const luka = run(event("401809244")).find(row => row.name === "Luka Doncic")!;
    expect(luka).toMatchObject({ fantasyPoints: 49.5, statistics: { dd: 1, td: 0, bonus_pt_40p: 1, bonus_pt_50p: 0 } });
    const paolo = run(event("401811041")).find(row => row.name === "Paolo Banchero")!;
    expect(paolo).toMatchObject({ fantasyPoints: 29.5, statistics: { dd: 1, td: 1 } });
  });

  test("a game crossing UTC midnight cannot influence a quote before End Game", () => {
    const row = run(event("401809243"))[0];
    expect(row.eventCutoff).toBe("2025-10-22T02:59:51.000Z");
    expect(gameInputsPrecede(row, "2025-10-21T23:30:00Z")).toBe(false);
    expect(gameInputsPrecede(row, "2025-10-22T00:00:00Z")).toBe(false);
    expect(gameInputsPrecede(row, "2025-10-22T02:59:50.999Z")).toBe(false);
    expect(gameInputsPrecede(row, "2025-10-22T02:59:51Z")).toBe(true);
    expect(gameInputsPrecede(row, "2025-10-22")).toBe(false);
  });

  test.each(["incomplete", "no-end", "no-wallclock", "duplicate-play", "after-end"])("rejects unverified completion: %s", state => {
    const input = event("401809243");
    if (state === "incomplete") input.completed = false;
    if (state === "no-end") input.selectedPlays = [];
    if (state === "no-wallclock") input.selectedPlays[0].wallclock = null;
    if (state === "duplicate-play") input.selectedPlays.push({ ...input.selectedPlays[0] });
    if (state === "after-end") input.selectedPlays.push({ id: "late", typeId: "103", typeText: "Free Throw - Technical", athleteIds: [], wallclock: "2025-10-23T00:00:00Z" });
    const rows = run(input);
    expect(rows.every(row => row.eventCutoff === null && row.fantasyPoints === null && !row.eligibleWithExistingMap)).toBe(true);
  });

  test("reconciles penalty evidence and does not trust missing totals or contradictory zero", () => {
    for (const state of ["missing", "contradiction", "unknown-type"]) {
      const input = event("401809244");
      const team = input.teams.find(row => row.id === "9")!;
      if (state === "missing") delete team.penaltyTotals.totalTechnicalFouls;
      if (state === "contradiction") team.penaltyTotals.technicalFouls = team.penaltyTotals.totalTechnicalFouls = "0";
      if (state === "unknown-type") input.selectedPlays.find(play => play.typeId === "35" && play.teamId === "9")!.typeText = "Double Technical Foul";
      expect(run(input).filter(row => row.teamId === "9" && row.participation === "played").every(row => row.fantasyPoints === null)).toBe(true);
    }
  });

  test("joins stat columns by source key and preserves missing weighted fields", () => {
    const input = event("401809243"), team = input.teams[0];
    team.statKeys.reverse(); team.athletes.forEach(row => row.stats?.reverse());
    expect(run(input).find(row => row.name === "Alperen Sengun")?.fantasyPoints).toBe(43);
    const index = team.statKeys.indexOf("blocks");
    team.athletes.find(row => row.name === "Alperen Sengun")!.stats![index] = "--";
    expect(run(input).find(row => row.name === "Alperen Sengun")).toMatchObject({ fantasyPoints: null, missingScoring: ["blk", "dd", "td"] });
  });

  test("an unsupported configured stat or ambiguous player identity is never a hidden default", () => {
    const input = event("401809243");
    const rows = auditTeamHistoryBoxScore(input, { ...options, scoring: { ...options.scoring, unknownStat: 2 }, existingIdentities: [...identities, { espnId: "3035622", sleeperId: "conflicting" }] });
    expect(rows.every(row => row.fantasyPoints === null)).toBe(true);
    const duplicate = auditTeamHistoryBoxScore(input, { ...options, existingIdentities: [...identities, { espnId: input.teams[0].athletes[0].id, sleeperId: "conflicting" }] });
    expect(duplicate[0]).toMatchObject({ existingSleeperId: null, eligibleWithExistingMap: false });
  });

  test("invalid calendar dates and unsafe score arithmetic do not become usable inputs", () => {
    const input = event("401809243");
    input.selectedPlays[0].wallclock = "2025-02-30T02:59:51Z";
    expect(run(input).every(row => row.eventCutoff === null && row.fantasyPoints === null)).toBe(true);
    const rows = auditTeamHistoryBoxScore(event("401809243"), { ...options, scoring: { pts: Number.MAX_VALUE } });
    expect(rows.filter(row => row.statistics.pts > 0).every(row => row.fantasyPoints === null && !row.eligibleWithExistingMap)).toBe(true);
    expect(rows.filter(row => row.participation === "played" && row.statistics.pts === 0).every(row => row.fantasyPoints === 0)).toBe(true);
  });
});
