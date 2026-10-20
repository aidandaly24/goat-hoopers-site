import { describe, expect, it } from "vitest";
import { PRACTICE_COURT } from "./free-throw";
import { LEGACY_FREE_THROW_PHYSICS, MOVING_COURT_PHYSICS, launchBall, stepBall, trajectory } from "./free-throw-physics";
import { shootingPositions } from "./free-throw-positions";
import { ACTIVE_FREE_THROW_ENGINE, parseFreeThrowPolicy, parseRankedReplayContext, rankedPhysics, rankedPositions, rankedReplayContext,
  rankedShotPosition, replayRankedRound, simulateRankedShot } from "./ranked-free-throw";
import { RankedRoundRecorder } from "./ranked-round";
import { run } from "@/data/ranked-free-throw/__tests__/fixtures";

const context = rankedReplayContext();
const powers = [50, 79, 51, 70, 37, 75, 51, 70, 75];
const policy = parseFreeThrowPolicy({ ruleSetId: "moving-fixture-only", engine: ACTIVE_FREE_THROW_ENGINE, shots: 9,
  durationMs: 70000, minShotIntervalMs: 1000, maxRunsPerWeek: 3 })!;
const inputs = powers.map((power, index) => ({ atMs: index * 7000, direction: 0, power }));

describe("versioned moving-court Free Throw", () => {
  it("uses the original nine practice spots in an equal, nonrepeating cycle for every account/run", () => {
    const positions = rankedPositions(context);
    expect(positions).toHaveLength(9);
    expect(new Set(positions.map(position => JSON.stringify(position)))).toEqual(new Set(shootingPositions(PRACTICE_COURT).map(position => JSON.stringify(position))));
    expect(positions).toEqual(rankedPositions(rankedReplayContext()));
    for (let i = 1; i < 100; i++) expect(rankedShotPosition(context, i)).not.toEqual(rankedShotPosition(context, i - 1));
    const returned = rankedShotPosition(context, 1); returned.x = 99;
    expect(rankedShotPosition(context, 1)).not.toEqual(returned);
  });

  it("repeated centered 50% input cannot make every position; adjusted shots are reachable at all nine", () => {
    const repeated = inputs.map(input => ({ ...input, power: 50 }));
    const result = replayRankedRound(repeated, 65000, policy, context);
    expect(result.outcomes).toEqual([1, 0, 1, 0, 1, 0, 1, 0, 0]);
    expect(result.statistics).toMatchObject({ score: 4, longestStreak: 1, endingStreak: 0 });
    const adjusted = replayRankedRound(inputs, 65000, policy, context);
    expect(adjusted.outcomes).toEqual(Array(9).fill(1));
    expect(adjusted.statistics).toEqual({ score: 9, makes: 9, attempts: 9, accuracy: 1, longestStreak: 9, endingStreak: 9 });
    expect(replayRankedRound(structuredClone(inputs), 65000, policy, structuredClone(context))).toEqual(adjusted);
  });

  it("increases power sensitivity 20% without a distance assist, random misses or changed colliders", () => {
    const speed = (physics: typeof LEGACY_FREE_THROW_PHYSICS, power: number, index: number) =>
      Math.hypot(...Object.values(launchBall(PRACTICE_COURT, { direction: 0, power }, rankedShotPosition(context, index), physics).velocity));
    for (let index = 0; index < 9; index++) {
      const base = speed(LEGACY_FREE_THROW_PHYSICS, 50, index);
      expect((speed(MOVING_COURT_PHYSICS, 60, index) - base) / (speed(LEGACY_FREE_THROW_PHYSICS, 60, index) - base)).toBeCloseTo(1.2, 10);
      expect(speed(MOVING_COURT_PHYSICS, 60, index)).toBeCloseTo(speed(MOVING_COURT_PHYSICS, 60, 0), 10);
    }
    expect(context.court).toEqual(PRACTICE_COURT);
  });

  it("browser flight/trajectory helpers and server replay use identical origin, launch response and outcomes", () => {
    for (const [index, input] of inputs.entries()) {
      const origin = rankedShotPosition(context, index), physics = rankedPhysics(context);
      const ball = launchBall(context.court, input, origin, physics);
      for (let step = 0; step < 1441 && !ball.finished; step++) stepBall(ball, context.court);
      expect(simulateRankedShot(input, context, index)).toEqual({ origin, outcome: ball.scored ? 1 : 0, durationMs: Math.ceil(ball.time * 1000) });
      expect(trajectory(context.court, input, origin, physics)[0]).toEqual(origin);
    }
  });

  it("records moving attempts by shot index and preserves input-only, replay-consistent submissions", () => {
    const admission = { run: { ...run, expiresAtMs: run.startedAtMs + policy.durationMs }, rules: policy, replayContext: context };
    const recorder = new RankedRoundRecorder(admission, 0, 100);
    let now = 100;
    for (const [index, input] of inputs.entries()) {
      expect(recorder.shoot(input, now)).toBe(true); recorder.settle();
      now += Math.max(1000, simulateRankedShot(input, context, index).durationMs);
    }
    const body = recorder.submission(now)!;
    expect(Object.keys(body).sort()).toEqual(["runId", "shots"]);
    expect(replayRankedRound(body.shots, now, policy, context).outcomes).toEqual(Array(9).fill(1));
  });

  it("keeps v1 replay readable and rejects mixed versions or altered v2 snapshots", () => {
    expect(parseFreeThrowPolicy({ ...policy, engine: [ACTIVE_FREE_THROW_ENGINE] })).toBeNull();
    const oldPolicy = { ...policy, engine: "fixed-line-makes-v1" as const };
    const oldContext = rankedReplayContext("fixed-line-makes-v1");
    expect(replayRankedRound(inputs.map(input => ({ ...input, power: 50 })), 65000, oldPolicy, oldContext).statistics.score).toBe(9);
    expect(() => replayRankedRound(inputs, 65000, policy, oldContext)).toThrow("inconsistent_replay_version");
    expect(parseRankedReplayContext(oldContext)).toEqual(oldContext);
    const snapshot = rankedReplayContext();
    if (snapshot.engine !== ACTIVE_FREE_THROW_ENGINE) throw new Error("fixture");
    for (const changed of [{ ...snapshot, positions: [] }, { ...snapshot, positions: Array(9) }, { ...snapshot, physics: { powerPerPercent: .035 } },
      { ...snapshot, positions: snapshot.positions.map((position, index) => index ? position : { ...position, x: 99 }) }]) {
      expect(parseRankedReplayContext(changed)).toBeNull();
    }
  });
});
