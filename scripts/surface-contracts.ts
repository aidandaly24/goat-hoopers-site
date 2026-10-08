import { readdirSync, readFileSync } from "node:fs";
import { join, posix, relative } from "node:path";
import ts from "typescript";

// Only these component files may compose sibling entrypoints. Keep in sync
// with ARCHITECTURE.md §3; the exception does not extend to the whole folder.
const COMPOSITE_ALLOWLIST: Record<string, readonly string[]> = {
  "surfaces/intel/IntelHub": [
    "surfaces/preview/MatchupPreview",
    "surfaces/playoffs/PlayoffOdds",
    "surfaces/power-rankings/PowerRankings",
    "surfaces/records/RecordBook",
  ],
  "surfaces/teams/TeamProfile": ["surfaces/history/FranchiseSection"],
};

const FORBIDDEN_RUNTIME = [
  "data/sleeper", "data/db", "drizzle-orm", "@neondatabase/serverless",
  "@vercel/postgres", "pg", "postgres", "api.sleeper.app",
];
const SOURCE_EXTENSION = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

export type Violation = { file: string; line: number; message: string };

function modulePath(file: string, spec: string): string {
  const path = spec.startsWith("@/") ? spec.slice(2)
    : spec.startsWith(".") ? posix.join(posix.dirname(file), spec) : spec;
  return posix.normalize(path).replace(SOURCE_EXTENSION, "");
}

function typeOnlyImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (!clause) return false; // Side-effect imports evaluate the module.
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return !clause.name && !!bindings && ts.isNamedImports(bindings)
    && bindings.elements.length > 0 && bindings.elements.every((e) => e.isTypeOnly);
}

function typeOnlyExport(node: ts.ExportDeclaration): boolean {
  return node.isTypeOnly || (!!node.exportClause && ts.isNamedExports(node.exportClause)
    && node.exportClause.elements.length > 0
    && node.exportClause.elements.every((e) => e.isTypeOnly));
}

function unwrap(expression: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
    || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
    expression = expression.expression;
  }
  return expression;
}

function isFetch(expression: ts.Expression): boolean {
  expression = unwrap(expression);
  if (ts.isIdentifier(expression)) return expression.text === "fetch";
  if (!ts.isPropertyAccessExpression(expression) || expression.name.text !== "fetch") return false;
  const owner = unwrap(expression.expression);
  return ts.isIdentifier(owner) && ["window", "globalThis", "self"].includes(owner.text);
}

// A literal URL or template's fixed prefix must be an app API path. URL parsing
// also catches backslashes and dot segments that a startsWith("/") check misses.
function apiUrl(expression: ts.Expression | undefined): boolean {
  if (!expression) return false;
  expression = unwrap(expression);
  const prefix = ts.isStringLiteralLike(expression) ? expression.text
    : ts.isTemplateExpression(expression) ? expression.head.text : null;
  if (prefix === null || !prefix.startsWith("/api/") || /[\\\u0000-\u0020\u007f]/.test(prefix)) return false;
  const url = new URL(prefix, "https://surface.invalid");
  return url.origin === "https://surface.invalid" && url.pathname.startsWith("/api/");
}

/** Analyze one source file, using a path relative to src (no I/O or execution). */
export function checkSurfaceSource(file: string, source: string): Violation[] {
  file = posix.normalize(file.replaceAll("\\", "/"));
  const surface = file.match(/^surfaces\/([^/]+)\//)?.[1];
  if (!surface) return [];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const violations: Violation[] = [];
  const report = (node: ts.Node, message: string) => {
    violations.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, message });
  };
  const checkModule = (node: ts.Node, specifier: ts.Expression, typeOnly = false) => {
    if (typeOnly) return;
    if (!ts.isStringLiteralLike(specifier)) {
      report(node, "runtime module must have a literal path so its surface contract can be checked");
      return;
    }
    const spec = specifier.text;
    const target = modulePath(file, spec);
    if (FORBIDDEN_RUNTIME.some((path) => target === path || target.startsWith(`${path}/`))) {
      report(node, `runtime import of data client "${spec}" — surfaces must use data-layer client seams or /api/* routes`);
    }
    const targetSurface = target.match(/^surfaces\/([^/]+)(?:\/|$)/)?.[1];
    if (targetSurface && targetSurface !== surface
      && !(COMPOSITE_ALLOWLIST[file.replace(SOURCE_EXTENSION, "")] ?? []).includes(target)) {
      report(node, `"${surface}" imports sibling surface "${spec}" — only documented composite entrypoints allowed (ARCHITECTURE.md §3)`);
    }
  };
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      checkModule(node, node.moduleSpecifier, typeOnlyImport(node));
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      checkModule(node, node.moduleSpecifier, typeOnlyExport(node));
    } else if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly
      && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression) {
      checkModule(node, node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      const callee = unwrap(node.expression);
      if ((callee.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(callee) && callee.text === "require")) && node.arguments[0]) {
        checkModule(node, node.arguments[0]);
      }
      if (isFetch(callee) && !apiUrl(node.arguments[0])) {
        report(node, "fetch() URL must have a statically verifiable same-origin /api/* prefix");
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return violations;
}

/** Walk production surface sources; fixtures and test files are checked by tests. */
export function checkSurfaceContracts(src: string): { files: string[]; violations: Violation[] } {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!["__tests__", "node_modules"].includes(entry.name)) walk(path);
      } else if (entry.isFile() && SOURCE_EXTENSION.test(entry.name) && !TEST_FILE.test(entry.name)) {
        files.push(path);
      }
    }
  };
  walk(join(src, "surfaces"));
  files.sort();
  return { files, violations: files.flatMap((file) => checkSurfaceSource(relative(src, file), readFileSync(file, "utf8"))) };
}
