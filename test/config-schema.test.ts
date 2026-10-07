// `quartz.configSchema` in package.json describes the options for editors such as QuartzControl,
// which builds its form from it. A schema that misses an option hides it; one that names an option
// the plugin does not have offers a switch that does nothing. Neither shows up in any other test,
// because the plugin never reads its own schema.
//
// So the schema is held against the two things that are true by construction: the options
// interface in src/types.ts (read with the TypeScript compiler, member by member, nested
// interfaces, Records, arrays, Omit<> and string-literal unions included) and the defaults in
// `quartz.defaultOptions`. Both directions: every option is in the schema, and the schema names
// nothing else.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT_INTERFACE = "LayoutBoxOptions";
const TYPES_FILE = path.join(__dirname, "../src/types.ts");

type Schema = Record<string, unknown>;
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")) as {
  quartz: { configSchema: Schema; defaultOptions: Record<string, unknown> };
};
const root = pkg.quartz.configSchema;

const isObject = (v: unknown): v is Schema =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function resolve(schema: unknown): Schema {
  if (!isObject(schema)) throw new Error(`not a schema: ${JSON.stringify(schema)}`);
  if (typeof schema.$ref !== "string") return schema;
  const match = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
  const defs = root.$defs as Schema | undefined;
  const target = match && defs ? defs[match[1]!] : undefined;
  if (!isObject(target)) throw new Error(`unresolvable ${schema.$ref}`);
  // Keywords beside the $ref win, as QuartzControl reads them.
  const { $ref: _ref, ...own } = schema;
  return { ...resolve(target), ...own };
}

const source = ts.createSourceFile(
  TYPES_FILE,
  fs.readFileSync(TYPES_FILE, "utf-8"),
  ts.ScriptTarget.Latest,
  true,
);
const decls = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();
source.forEachChild((node) => {
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
    decls.set(node.name.text, node);
});

function membersOf(decl: ts.InterfaceDeclaration | ts.TypeLiteralNode): Map<string, ts.TypeNode> {
  const out = new Map<string, ts.TypeNode>();
  for (const m of decl.members) {
    if (
      ts.isPropertySignature(m) &&
      m.type &&
      (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))
    ) {
      out.set(m.name.text, m.type);
    }
  }
  return out;
}

function stringLiterals(node: ts.TypeNode): string[] | null {
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text];
  if (ts.isUnionTypeNode(node)) {
    const all = node.types.map(stringLiterals);
    return all.every((x): x is string[] => x !== null) ? all.flat() : null;
  }
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const decl = decls.get(node.typeName.text);
    if (decl && ts.isTypeAliasDeclaration(decl)) return stringLiterals(decl.type);
  }
  return null;
}

const problems: string[] = [];

function checkObject(members: Map<string, ts.TypeNode>, schema: Schema, at: string): void {
  const props = isObject(schema.properties) ? schema.properties : {};
  for (const key of members.keys())
    if (!(key in props)) problems.push(`${at}${key}: in the type, not in the schema`);
  for (const key of Object.keys(props))
    if (!members.has(key)) problems.push(`${at}${key}: in the schema, not in the type`);
  for (const [key, type] of members)
    if (key in props) checkType(type, resolve(props[key]), `${at}${key}`);
}

function checkType(node: ts.TypeNode, schema: Schema, at: string): void {
  const literals = stringLiterals(node);
  if (literals && literals.length > 1) {
    const values = Array.isArray(schema.enum) ? schema.enum : [];
    if ([...values].sort().join("|") !== [...literals].sort().join("|")) {
      problems.push(`${at}: enum ${JSON.stringify(values)} is not ${JSON.stringify(literals)}`);
    }
    return;
  }
  switch (node.kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword: {
      const want =
        node.kind === ts.SyntaxKind.BooleanKeyword
          ? "boolean"
          : node.kind === ts.SyntaxKind.StringKeyword
            ? "string"
            : "number";
      if (schema.type !== want && !(want === "number" && schema.type === "integer"))
        problems.push(`${at}: type ${String(schema.type)}, the type says ${want}`);
      return;
    }
  }
  if (ts.isArrayTypeNode(node)) {
    if (schema.type !== "array") problems.push(`${at}: not an array in the schema`);
    else checkType(node.elementType, resolve(schema.items), `${at}[]`);
    return;
  }
  if (ts.isParenthesizedTypeNode(node)) return checkType(node.type, schema, at);
  if (ts.isTypeLiteralNode(node)) return checkObject(membersOf(node), schema, `${at}.`);
  if (ts.isUnionTypeNode(node)) {
    const variants = (
      Array.isArray(schema.anyOf) ? schema.anyOf : Array.isArray(schema.oneOf) ? schema.oneOf : []
    ).map(resolve);
    const members = node.types.filter((t) => t.kind !== ts.SyntaxKind.UndefinedKeyword);
    if (variants.length !== members.length) {
      problems.push(
        `${at}: ${members.length} alternatives in the type, ${variants.length} in the schema`,
      );
      return;
    }
    members.forEach((m, i) => checkType(m, variants[i]!, `${at}|${i}`));
    return;
  }
  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    const name = node.typeName.text;
    const args = node.typeArguments ?? [];
    if (name === "Record") {
      if (!isObject(schema.additionalProperties))
        problems.push(`${at}: a Record without additionalProperties`);
      else checkType(args[1]!, resolve(schema.additionalProperties), `${at}.*`);
      return;
    }
    if (name === "Omit" || name === "Pick") {
      const inner = args[0]!;
      const keys = stringLiterals(args[1]!) ?? [];
      const decl =
        ts.isTypeReferenceNode(inner) && ts.isIdentifier(inner.typeName)
          ? decls.get(inner.typeName.text)
          : undefined;
      if (!decl || !ts.isInterfaceDeclaration(decl)) {
        problems.push(`${at}: ${name}<> over something that is not a local interface`);
        return;
      }
      const all = membersOf(decl);
      const kept = new Map(
        [...all].filter(([k]) => (name === "Omit" ? !keys.includes(k) : keys.includes(k))),
      );
      checkObject(kept, schema, `${at}.`);
      return;
    }
    const decl = decls.get(name);
    if (decl && ts.isInterfaceDeclaration(decl))
      return checkObject(membersOf(decl), schema, `${at}.`);
    if (decl && ts.isTypeAliasDeclaration(decl)) return checkType(decl.type, schema, at);
  }
  problems.push(`${at}: type syntax this test does not follow (${ts.SyntaxKind[node.kind]})`);
}

// Every property, at every depth, as QuartzControl would show it.
function* properties(schema: Schema, at: string): Generator<[string, Schema, Schema]> {
  const props = isObject(schema.properties) ? schema.properties : {};
  for (const [key, raw] of Object.entries(props)) {
    const prop = resolve(raw);
    yield [`${at}${key}`, prop, props];
    yield* nested(prop, `${at}${key}`);
  }
}
function* nested(schema: Schema, at: string): Generator<[string, Schema, Schema]> {
  if (isObject(schema.properties)) yield* properties(schema, `${at}.`);
  if (isObject(schema.additionalProperties))
    yield* nested(resolve(schema.additionalProperties), `${at}.*`);
  if (isObject(schema.items)) yield* nested(resolve(schema.items), `${at}[]`);
  for (const alt of [
    ...((schema.anyOf as unknown[]) ?? []),
    ...((schema.oneOf as unknown[]) ?? []),
  ])
    yield* nested(resolve(alt), at);
}

describe("quartz.configSchema", () => {
  it("names exactly the options of the options interface, with matching types", () => {
    const decl = decls.get(ROOT_INTERFACE);
    expect(decl && ts.isInterfaceDeclaration(decl)).toBe(true);
    problems.length = 0;
    checkObject(membersOf(decl as ts.InterfaceDeclaration), root, "");
    expect(problems).toEqual([]);
  });

  it("names every key of quartz.defaultOptions, and every default fits its schema", () => {
    const missing: string[] = [];
    const walk = (values: Record<string, unknown>, schema: Schema, at: string): void => {
      const props = isObject(schema.properties) ? schema.properties : {};
      for (const [key, value] of Object.entries(values)) {
        if (!(key in props)) {
          missing.push(`${at}${key}`);
          continue;
        }
        const prop = resolve(props[key]);
        if (Array.isArray(prop.enum) && !prop.enum.includes(value))
          missing.push(`${at}${key}: default ${JSON.stringify(value)} not in enum`);
        if (isObject(value) && isObject(prop.properties)) walk(value, prop, `${at}${key}.`);
      }
    };
    walk(pkg.quartz.defaultOptions, root, "");
    expect(missing).toEqual([]);
  });

  it("explains every option in English and German", () => {
    const bare = [...properties(root, "")]
      .filter(([, p]) => {
        const de = (p["x-quartz-l10n"] as Record<string, Record<string, unknown>> | undefined)?.de;
        return typeof p.description !== "string" || typeof de?.description !== "string";
      })
      .map(([at]) => at);
    expect(bare).toEqual([]);
  });

  // A description is read on its own, in a form. Two marks of a sentence cut from somewhere else:
  // an odd number of backticks (a code span cut in half) and a pipe between code spans (the rest of
  // a Markdown table row) - quartz-navigations 0.4.0 shipped 17 German descriptions like that,
  // because its README's option table was split at escaped pipes.
  it("keeps every description free of table debris", () => {
    const debris: string[] = [];
    for (const [at, prop] of properties(root, "")) {
      const texts = [
        prop.description,
        ...Object.values(
          (prop["x-quartz-l10n"] as Record<string, Record<string, unknown>>) ?? {},
        ).map((l) => l.description),
      ];
      for (const text of texts) {
        if (typeof text !== "string") continue;
        if ((text.match(/`/g) ?? []).length % 2 === 1 || /[`"]\s*\\?\|\s*[`"]/.test(text))
          debris.push(`${at}: ${text.slice(0, 60)}`);
      }
    }
    expect(debris).toEqual([]);
  });

  it("makes every x-quartz-when name a sibling and a value it can have", () => {
    const wrong: string[] = [];
    for (const [at, prop, siblings] of properties(root, "")) {
      const when = prop["x-quartz-when"];
      if (when === undefined) continue;
      if (!isObject(when)) {
        wrong.push(`${at}: x-quartz-when is not an object`);
        continue;
      }
      for (const [key, allowed] of Object.entries(when)) {
        if (!(key in siblings)) {
          wrong.push(`${at}: x-quartz-when names ${key}, which is not a sibling`);
          continue;
        }
        const sibling = resolve(siblings[key]);
        for (const value of Array.isArray(allowed) ? allowed : [allowed]) {
          const fits = Array.isArray(sibling.enum)
            ? sibling.enum.includes(value)
            : typeof value === sibling.type;
          if (!fits)
            wrong.push(
              `${at}: x-quartz-when ${key} = ${JSON.stringify(value)}, which ${key} cannot be`,
            );
        }
      }
    }
    expect(wrong).toEqual([]);
  });
});
