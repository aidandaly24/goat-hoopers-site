// Registers the CSS stub hooks before the evidence entry point loads.
import { register } from "node:module";

register("./css-stub-hooks.mjs", import.meta.url);
