type JsonRule = Record<string, unknown>;

interface EvalContext {
  data: Record<string, unknown>;
  ui: {
    activeField: string | null;
    touched: Record<string, boolean>;
    viewType?: string;
  };
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if ((ch === '"' || ch === "'") && input[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
      current += ch;
      continue;
    }
    if (!inQuote) {
      if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function asVarPath(token: string): string | null {
  const value = token.trim();
  if (value.startsWith('data.')) return value;
  if (value.startsWith('ui.')) return value;
  const displayRef = value.match(/^\[([^\]]+)\]\.\[DisplayName\]$/i);
  if (displayRef) return `data["${displayRef[1]}"]`;
  const bracketRef = value.match(/^\[([^\]]+)\]$/);
  if (bracketRef) return `data["${bracketRef[1]}"]`;
  if (value === 'CONTEXT("ViewType")' || value === "CONTEXT('ViewType')") return 'ui.viewType';
  return null;
}

function parseArrayLiteral(token: string): unknown[] | null {
  const trimmed = token.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    const body = trimmed.slice(1, -1).trim();
    if (!body) return [];
    return splitTopLevel(body).map(parseValueToken);
  }
  if (/^LIST\(/i.test(trimmed) && trimmed.endsWith(')')) {
    const body = trimmed.slice(trimmed.indexOf('(') + 1, -1);
    return splitTopLevel(body).map(parseValueToken);
  }
  return null;
}

function parseValueToken(token: string): unknown {
  const t = token.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (!Number.isNaN(Number(t)) && t !== '') return Number(t);

  const array = parseArrayLiteral(t);
  if (array) return array;

  const path = asVarPath(t);
  if (path) return { var: path };
  return t;
}

function stripOuterParens(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return trimmed;
  let depth = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (depth === 0 && i < trimmed.length - 1) return trimmed;
  }
  return trimmed.slice(1, -1).trim();
}

function compileInternal(expr: string): JsonRule | null {
  const normalized = stripOuterParens(expr.trim());
  if (!normalized) return null;

  const andParts = splitByOperator(normalized, '&&');
  if (andParts.length > 1) {
    return { and: andParts.map((part) => compileInternal(part) || parseValueToken(part)) };
  }

  const orParts = splitByOperator(normalized, '||');
  if (orParts.length > 1) {
    return { or: orParts.map((part) => compileInternal(part) || parseValueToken(part)) };
  }

  const commaPattern = normalized.match(/^\((.+),(.+)\)$/);
  if (commaPattern) {
    const left = compileInternal(commaPattern[1].trim()) || parseValueToken(commaPattern[1].trim());
    const right = compileInternal(commaPattern[2].trim()) || parseValueToken(commaPattern[2].trim());
    return { or: [left, right] };
  }

  const functionMatch = normalized.match(/^([A-Z]+)\((.*)\)$/i);
  if (functionMatch) {
    const fn = functionMatch[1].toUpperCase();
    const argsText = functionMatch[2];
    const args = splitTopLevel(argsText);
    if (fn === 'AND') return { and: args.map((a) => compileInternal(a) || parseValueToken(a)) };
    if (fn === 'OR') return { or: args.map((a) => compileInternal(a) || parseValueToken(a)) };
    if (fn === 'NOT') return { '!': [compileInternal(args[0]) || parseValueToken(args[0])] };
    if (fn === 'ISNOTBLANK') return { notBlank: [compileInternal(args[0]) || parseValueToken(args[0])] };
    if (fn === 'IN') {
      const left = compileInternal(args[0]) || parseValueToken(args[0]);
      const right = compileInternal(args[1]) || parseValueToken(args[1]);
      return { in: [left, right] };
    }
  }

  const includesMatch = normalized.match(/^(.+)\.includes\((.+)\)$/);
  if (includesMatch) {
    const listVal = parseValueToken(includesMatch[1]);
    const itemVal = compileInternal(includesMatch[2]) || parseValueToken(includesMatch[2]);
    return { in: [itemVal, listVal] };
  }

  const booleanMatch = normalized.match(/^Boolean\((.+)\)$/);
  if (booleanMatch) {
    return { truthy: [compileInternal(booleanMatch[1]) || parseValueToken(booleanMatch[1])] };
  }

  if (normalized.startsWith('!!')) {
    const inner = normalized.slice(2);
    return { truthy: [compileInternal(inner) || parseValueToken(inner)] };
  }

  if (normalized.startsWith('!')) {
    const inner = normalized.slice(1);
    return { '!': [compileInternal(inner) || parseValueToken(inner)] };
  }

  const operators = ['===', '!==', '<>', '==', '!=', '='];
  for (const op of operators) {
    const idx = normalized.indexOf(op);
    if (idx > -1) {
      const left = normalized.slice(0, idx).trim();
      const right = normalized.slice(idx + op.length).trim();
      const leftVal = parseValueToken(left);
      const rightVal = parseValueToken(right);
      if (op === '===' || op === '==') return { '==': [leftVal, rightVal] };
      return { '!=': [leftVal, rightVal] };
    }
  }

  const varPath = asVarPath(normalized);
  if (varPath) return { var: varPath };
  return null;
}

function splitByOperator(input: string, operator: '&&' | '||'): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];
    if ((ch === '"' || ch === "'") && input[i - 1] !== '\\') {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
      current += ch;
      continue;
    }
    if (!inQuote) {
      if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
      if (depth === 0 && ch === operator[0] && next === operator[1]) {
        parts.push(current.trim());
        current = '';
        i += 1;
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function compileShowIfToJsonRule(expression?: string | null): JsonRule | null {
  if (!expression) return null;
  return compileInternal(expression);
}

function resolveVar(path: string, ctx: EvalContext): unknown {
  const bracketPath = path.match(/^([a-zA-Z_]\w*)\["(.+)"\]$/);
  if (bracketPath) {
    const root = bracketPath[1];
    const key = bracketPath[2];
    const rootObj = (ctx as unknown as Record<string, unknown>)[root];
    if (rootObj && typeof rootObj === 'object') {
      return (rootObj as Record<string, unknown>)[key];
    }
    return undefined;
  }

  const parts = path.split('.');
  let cur: unknown = ctx;
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

function truthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function evalNode(node: unknown, ctx: EvalContext): unknown {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const obj = node as Record<string, unknown>;
    if ('var' in obj) return resolveVar(String(obj.var), ctx);
    if ('and' in obj) return (obj.and as unknown[]).every((n) => truthy(evalNode(n, ctx)));
    if ('or' in obj) return (obj.or as unknown[]).some((n) => truthy(evalNode(n, ctx)));
    if ('!' in obj) return !truthy(evalNode((obj['!'] as unknown[])[0], ctx));
    if ('==' in obj) {
      const args = obj['=='] as unknown[];
      return evalNode(args[0], ctx) === evalNode(args[1], ctx);
    }
    if ('!=' in obj) {
      const args = obj['!='] as unknown[];
      return evalNode(args[0], ctx) !== evalNode(args[1], ctx);
    }
    if ('in' in obj) {
      const args = obj.in as unknown[];
      const item = evalNode(args[0], ctx);
      const list = evalNode(args[1], ctx);
      if (Array.isArray(list)) return list.includes(item as never);
      return false;
    }
    if ('truthy' in obj) return truthy(evalNode((obj.truthy as unknown[])[0], ctx));
    if ('notBlank' in obj) {
      const value = evalNode((obj.notBlank as unknown[])[0], ctx);
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }
  }
  return node;
}

export function evaluateJsonRule(rule: JsonRule, ctx: EvalContext): boolean {
  return truthy(evalNode(rule, ctx));
}
