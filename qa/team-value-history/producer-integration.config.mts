import { defineConfig } from "vitest/config";
import base from "../../vitest.config.mjs";
export default defineConfig({ ...base, test: { ...base.test, include: ["qa/team-value-history/producer-integration.test.tsx"] } });
