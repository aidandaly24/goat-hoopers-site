// Registers the CSS stub hooks before the verify entry point loads.
import { register } from "node:module";

register("./css-stub.mjs", import.meta.url);
