/* Source inventory only: ancestor/component styles still require rendering. */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const links = [];
for (const name of fs.readdirSync("src", { recursive: true })) {
  if (!name.endsWith(".tsx") || /\.test\.|(^|\/)test\/|__tests__\//.test(name)) continue;
  const file = path.join("src", name);
  const ast = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ["Link", "a"].includes(node.tagName.getText(ast))) {
      const ownClass = node.attributes.properties.some(property => property.name?.getText(ast) === "className");
      let parent = node.parent, ancestorClass = false;
      while (parent) {
        if (ts.isJsxElement(parent) && parent.openingElement.attributes.properties.some(property => property.name?.getText(ast) === "className")) ancestorClass = true;
        parent = parent.parent;
      }
      links.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, ownClass, ancestorClass });
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const evidence = {
  method: "Production TSX Link/anchor source inventory; not a rendered-state or computed-color audit.",
  productionDeclarations: links.length,
  candidates: links.filter(link => !link.ownClass && !link.ancestorClass),
  manualSourceCheck: "SiteHeader callback links receive nav/panel descendant CSS when rendered. The remaining four candidates are the account/team page links; visual repairs are pending screenshot inspection.",
};
fs.mkdirSync("qa/account-settings/evidence", { recursive: true });
fs.writeFileSync("qa/account-settings/evidence/source-link-audit.json", JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
