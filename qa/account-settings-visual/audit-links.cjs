const fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
const links = [];
for (const name of fs.readdirSync("src", { recursive: true })) {
  if (!name.endsWith(".tsx") || /\.test\.|(^|\/)test\/|__tests__\//.test(name)) continue;
  const file = path.join("src", name), ast = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ["Link", "a"].includes(node.tagName.getText(ast))) {
      const hasClass = tag => tag.attributes.properties.some(p => p.name?.getText(ast) === "className");
      let ancestorClass = false;
      for (let parent = node.parent; parent; parent = parent.parent) if (ts.isJsxElement(parent) && hasClass(parent.openingElement)) ancestorClass = true;
      links.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, ownClass: hasClass(node), ancestorClass });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const report = { method: "Production TSX inventory; only missing direct/ancestor classes are flagged. This is source evidence, not proof of every rendered route/state.", count: links.length, candidates: links.filter(x => !x.ownClass && !x.ancestorClass), manualCheck: "The remaining SiteHeader callback links receive .nav/.panelLinks descendant styles. The former four account/team bare declarations are removed; account help links now use explicit shared control classes. Rendered coverage and contrast are recorded separately in browser.json." };
fs.mkdirSync("qa/account-settings-visual/evidence", { recursive: true });
fs.writeFileSync("qa/account-settings-visual/evidence/source-link-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
