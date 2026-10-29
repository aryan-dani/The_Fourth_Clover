#!/usr/bin/env node
/**
 * Static guard against JSX/HTML patterns that caused React hydration #418.
 * Uses the TypeScript compiler API (already a project dependency).
 *
 * Usage:
 *   node scripts/check-markup.mjs           # scan src/
 *   node scripts/check-markup.mjs --self-test
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const BLOCK_TAGS = new Set([
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "section",
  "article",
  "header",
  "footer",
  "table",
  "form",
  "button",
  "main",
  "nav",
  "aside",
  "figure",
  "blockquote",
]);

const BANNED_IMPORTS = new Set([
  "gsap/SplitText",
  "gsap/dist/SplitText",
  "@gsap/react",
]);

/** @typedef {{ file: string, line: number, col: number, message: string }} Finding */

/**
 * @param {string} filePath
 * @param {string} source
 * @returns {Finding[]}
 */
function analyzeSource(filePath, source) {
  /** @type {Finding[]} */
  const findings = [];
  const sf = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");

  /**
   * @param {ts.Node} node
   * @param {number} pos
   * @param {string} message
   */
  function add(node, pos, message) {
    const { line, character } = sf.getLineAndCharacterOfPosition(pos);
    findings.push({
      file: rel,
      line: line + 1,
      col: character + 1,
      message,
    });
  }

  /**
   * @param {ts.JsxAttribute | ts.JsxSpreadAttribute} attr
   * @returns {boolean}
   */
  function isEmptyStringSrc(attr) {
    if (!ts.isJsxAttribute(attr)) return false;
    if (attr.name.getText(sf) !== "src") return false;
    if (!attr.initializer) return true;
    if (ts.isStringLiteral(attr.initializer)) {
      return attr.initializer.text === "";
    }
    if (
      ts.isJsxExpression(attr.initializer) &&
      attr.initializer.expression
    ) {
      const expr = attr.initializer.expression;
      // src={... || ""} or src={... || ''}
      if (
        ts.isBinaryExpression(expr) &&
        expr.operatorToken.kind === ts.SyntaxKind.BarBarToken
      ) {
        const right = expr.right;
        if (
          (ts.isStringLiteral(right) || ts.isNoSubstitutionTemplateLiteral(right)) &&
          right.text === ""
        ) {
          return true;
        }
      }
      // src={""}
      if (ts.isStringLiteral(expr) && expr.text === "") return true;
    }
    return false;
  }

  /**
   * @param {ts.JsxElement | ts.JsxSelfClosingElement} node
   * @returns {string}
   */
  function tagName(node) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    return opening.tagName.getText(sf);
  }

  /**
   * @param {ts.Node} node
   * @returns {boolean}
   */
  function isLinkLike(node) {
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) return false;
    const name = tagName(node);
    return name === "a" || name === "Link";
  }

  /**
   * @param {ts.Node} node
   * @param {(n: ts.Node) => void} visit
   */
  function walkJsxChildren(node, visit) {
    if (ts.isJsxElement(node)) {
      for (const child of node.children) visit(child);
    }
  }

  /**
   * Recursively check descendants of a Link/a for block tags.
   * @param {ts.Node} node
   * @param {string} linkTag
   * @param {number} linkPos
   */
  function scanForBlocks(node, linkTag, linkPos) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = tagName(node).toLowerCase();
      // Strip namespace / member access: Foo.Bar -> Bar not needed for intrinsic
      const base = name.includes(".") ? name.split(".").pop() : name;
      if (base && BLOCK_TAGS.has(base)) {
        add(
          node,
          node.getStart(sf),
          `<${linkTag}> must not wrap block element <${base}> (causes React #418 HTML hydration mismatches)`,
        );
      }
      if (ts.isJsxElement(node)) {
        for (const child of node.children) {
          scanForBlocks(child, linkTag, linkPos);
        }
      }
      return;
    }
    if (ts.isJsxFragment(node)) {
      for (const child of node.children) {
        scanForBlocks(child, linkTag, linkPos);
      }
      return;
    }
    if (ts.isJsxExpression(node) && node.expression) {
      // Look inside simple ternaries / fragments returned from expressions is hard;
      // still walk the expression tree for nested JSX.
      ts.forEachChild(node.expression, function walk(n) {
        if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
          scanForBlocks(n, linkTag, linkPos);
        } else {
          ts.forEachChild(n, walk);
        }
      });
    }
  }

  function visit(node) {
    // Banned imports
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const mod = node.moduleSpecifier.text;
      if (BANNED_IMPORTS.has(mod)) {
        add(
          node,
          node.getStart(sf),
          `Banned import "${mod}" (hydration / DOM-rewrite hazard)`,
        );
      }
    }

    // AvatarImage empty src
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const name = node.tagName.getText(sf);
      if (name === "AvatarImage") {
        for (const attr of node.attributes.properties) {
          if (isEmptyStringSrc(attr)) {
            add(
              attr,
              attr.getStart(sf),
              `AvatarImage must not use empty string src (use undefined / omit; causes #418)`,
            );
          }
        }
      }
    }

    // Link / a wrapping block elements
    if (isLinkLike(node) && ts.isJsxElement(node)) {
      const name = tagName(node);
      walkJsxChildren(node, (child) => {
        scanForBlocks(child, name, node.getStart(sf));
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return findings;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function collectSourceFiles(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...collectSourceFiles(full));
    } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function runSelfTest() {
  /** @type {{ name: string, source: string, expectFail: boolean }[]} */
  const cases = [
    {
      name: "link-wraps-p",
      expectFail: true,
      source: `import Link from "next/link";
export function A() {
  return <Link href="/x"><p>hi</p></Link>;
}
`,
    },
    {
      name: "link-wraps-h2-in-div",
      expectFail: true,
      source: `import Link from "next/link";
export function A() {
  return (
    <Link href="/x">
      <div>
        <h2>Title</h2>
      </div>
    </Link>
  );
}
`,
    },
    {
      name: "anchor-wraps-button",
      expectFail: true,
      source: `export function A() {
  return <a href="/x"><button type="button">Go</button></a>;
}
`,
    },
    {
      name: "link-spans-ok",
      expectFail: false,
      source: `import Link from "next/link";
export function A() {
  return (
    <Link href="/x">
      <span className="block">Title</span>
    </Link>
  );
}
`,
    },
    {
      name: "banned-splittext",
      expectFail: true,
      source: `import { SplitText } from "gsap/SplitText";
export const x = SplitText;
`,
    },
    {
      name: "banned-gsap-react",
      expectFail: true,
      source: `import { useGSAP } from "@gsap/react";
export const x = useGSAP;
`,
    },
    {
      name: "avatar-empty-literal",
      expectFail: true,
      source: `export function A() {
  return <AvatarImage src="" />;
}
`,
    },
    {
      name: "avatar-or-empty",
      expectFail: true,
      source: `export function A({ url }: { url?: string }) {
  return <AvatarImage src={url || ""} />;
}
`,
    },
    {
      name: "avatar-undefined-ok",
      expectFail: false,
      source: `export function A({ url }: { url?: string }) {
  return <AvatarImage src={url || undefined} />;
}
`,
    },
  ];

  let failed = 0;
  for (const c of cases) {
    const findings = analyzeSource(`self-test/${c.name}.tsx`, c.source);
    const didFail = findings.length > 0;
    if (didFail !== c.expectFail) {
      console.error(
        `SELF-TEST FAIL: ${c.name} expected ${c.expectFail ? "findings" : "clean"}, got ${findings.length}`,
      );
      for (const f of findings) console.error(`  - ${f.message}`);
      failed += 1;
    } else {
      console.log(`SELF-TEST OK: ${c.name}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} self-test case(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll markup self-tests passed.");
}

function runScan() {
  const files = collectSourceFiles(SRC);
  /** @type {Finding[]} */
  const all = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    all.push(...analyzeSource(file, source));
  }

  if (all.length === 0) {
    console.log(`check-markup: scanned ${files.length} files — clean.`);
    return;
  }

  console.error(`check-markup: ${all.length} problem(s) in ${files.length} files:\n`);
  for (const f of all) {
    console.error(`  ${f.file}:${f.line}:${f.col}  ${f.message}`);
  }
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) {
  runSelfTest();
} else {
  runScan();
}
