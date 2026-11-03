// A small static highlighter that reproduces Monaco's "vs-dark" colours for Python and Go.
// It ports Monaco's own Monarch grammars (monaco-editor/esm/vs/basic-languages/{python,go}) and its
// default bracket-pair colouring, so read-only code can look like the editor without loading it.

export type HighlightLanguage = "python" | "go";
export type HighlightToken = { text: string; color: string };

type TokenFn = (match: string) => string;
type Rule = { re: RegExp; token: string | TokenFn; next?: string };

const rule = (source: RegExp, token: string | TokenFn, next?: string): Rule =>
  ({ re: new RegExp(`^(?:${source.source})`), token, next });

const PY_KEYWORDS = new Set([
  "False", "None", "True", "_", "and", "as", "assert", "async", "await", "break", "case", "class", "continue", "def", "del", "elif",
  "else", "except", "exec", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "match", "nonlocal", "not",
  "or", "pass", "print", "raise", "return", "try", "type", "while", "with", "yield", "int", "float", "long", "complex", "hex", "abs",
  "all", "any", "apply", "basestring", "bin", "bool", "buffer", "bytearray", "callable", "chr", "classmethod", "cmp", "coerce",
  "compile", "delattr", "dict", "dir", "divmod", "enumerate", "eval", "execfile", "file", "filter", "format", "frozenset",
  "getattr", "globals", "hasattr", "hash", "help", "id", "input", "intern", "isinstance", "issubclass", "iter", "len", "locals",
  "list", "map", "max", "memoryview", "min", "next", "object", "oct", "open", "ord", "pow", "property", "reversed", "range",
  "raw_input", "reduce", "reload", "repr", "round", "self", "set", "setattr", "slice", "sorted", "staticmethod", "str", "sum",
  "super", "tuple", "unichr", "unicode", "vars", "xrange", "zip", "__dict__", "__methods__", "__members__", "__class__",
  "__bases__", "__name__", "__mro__", "__subclasses__", "__init__", "__import__",
]);

const PY_WHITESPACE = [rule(/\s+/, "white"), rule(/(^#.*$)/, "comment"), rule(/'''/, "string", "endDocString"), rule(/"""/, "string", "endDblDocString")];
const PY_NUMBERS = [rule(/-?0x([abcdef]|[ABCDEF]|\d)+[lL]?/, "number.hex"), rule(/-?(\d*\.)?\d+([eE][+\-]?\d+)?[jJ]?[lL]?/, "number")];
const PY_STRINGS = [
  rule(/'$/, "string.escape", "@popall"), rule(/f'{1,3}/, "string.escape", "fStringBody"), rule(/'/, "string.escape", "stringBody"),
  rule(/"$/, "string.escape", "@popall"), rule(/f"{1,3}/, "string.escape", "fDblStringBody"), rule(/"/, "string.escape", "dblStringBody"),
];
const PYTHON: Record<string, Rule[]> = {
  root: [
    ...PY_WHITESPACE, ...PY_NUMBERS, ...PY_STRINGS,
    rule(/[,:;]/, "delimiter"),
    rule(/[{}\[\]()]/, "delimiter.bracket"),
    rule(/@[a-zA-Z_]\w*/, "tag"),
    rule(/[a-zA-Z_]\w*/, word => PY_KEYWORDS.has(word) ? "keyword" : "identifier"),
  ],
  endDocString: [rule(/[^']+/, "string"), rule(/\\'/, "string"), rule(/'''/, "string", "@popall"), rule(/'/, "string")],
  endDblDocString: [rule(/[^"]+/, "string"), rule(/\\"/, "string"), rule(/"""/, "string", "@popall"), rule(/"/, "string")],
  fStringBody: [rule(/[^\\'\{\}]+$/, "string", "@popall"), rule(/[^\\'\{\}]+/, "string"), rule(/\{[^\}':!=]+/, "identifier", "fStringDetail"), rule(/\\./, "string"), rule(/'/, "string.escape", "@popall"), rule(/\\$/, "string")],
  stringBody: [rule(/[^\\']+$/, "string", "@popall"), rule(/[^\\']+/, "string"), rule(/\\./, "string"), rule(/'/, "string.escape", "@popall"), rule(/\\$/, "string")],
  fDblStringBody: [rule(/[^\\"\{\}]+$/, "string", "@popall"), rule(/[^\\"\{\}]+/, "string"), rule(/\{[^\}':!=]+/, "identifier", "fStringDetail"), rule(/\\./, "string"), rule(/"/, "string.escape", "@popall"), rule(/\\$/, "string")],
  dblStringBody: [rule(/[^\\"]+$/, "string", "@popall"), rule(/[^\\"]+/, "string"), rule(/\\./, "string"), rule(/"/, "string.escape", "@popall"), rule(/\\$/, "string")],
  fStringDetail: [rule(/[:][^}]+/, "string"), rule(/[!][ars]/, "string"), rule(/=/, "string"), rule(/\}/, "identifier", "@pop")],
};

const GO_KEYWORDS = new Set([
  "break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import",
  "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "bool", "true", "false", "uint8",
  "uint16", "uint32", "uint64", "int8", "int16", "int32", "int64", "float32", "float64", "complex64", "complex128", "byte", "rune",
  "uint", "int", "uintptr", "string", "nil",
]);
const GO_OPERATORS = new Set([
  "+", "-", "*", "/", "%", "&", "|", "^", "<<", ">>", "&^", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", "&^=",
  "&&", "||", "<-", "++", "--", "==", "<", ">", "=", "!", "!=", "<=", ">=", ":=", "...", "(", ")", "[", "]", "{", "}", ",", ";", ".", ":",
]);
const GO_SYMBOLS = /[=><!~?:&|+\-*\/\^%]+/;
const GO_ESCAPES = /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
const GO: Record<string, Rule[]> = {
  root: [
    rule(/[a-zA-Z_]\w*/, word => GO_KEYWORDS.has(word) ? `keyword.${word}` : "identifier"),
    rule(/[ \t\r\n]+/, ""), rule(/\/\*\*(?!\/)/, "comment.doc", "doccomment"), rule(/\/\*/, "comment", "comment"), rule(/\/\/.*$/, "comment"),
    rule(/\[\[.*\]\]/, "annotation"),
    rule(/^\s*#\w+/, "keyword"),
    rule(/[{}()\[\]]/, "delimiter.bracket"),
    rule(new RegExp(`[<>](?!${GO_SYMBOLS.source})`), "delimiter.angle"),
    rule(GO_SYMBOLS, symbol => GO_OPERATORS.has(symbol) ? "delimiter" : ""),
    rule(/\d*\d+[eE]([\-+]?\d+)?/, "number.float"), rule(/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"),
    rule(/0[xX][0-9a-fA-F']*[0-9a-fA-F]/, "number.hex"), rule(/0[0-7']*[0-7]/, "number.octal"), rule(/0[bB][0-1']*[0-1]/, "number.binary"),
    rule(/\d[\d']*/, "number"), rule(/\d/, "number"),
    rule(/[;,.]/, "delimiter"),
    rule(/"([^"\\]|\\.)*$/, "string.invalid"), rule(/"/, "string", "string"), rule(/`/, "string", "rawstring"),
    rule(/'[^\\']'/, "string"), rule(new RegExp(`(')(${GO_ESCAPES.source})(')`), "string"), rule(/'/, "string.invalid"),
  ],
  comment: [rule(/[^\/*]+/, "comment"), rule(/\*\//, "comment", "@pop"), rule(/[\/*]/, "comment")],
  doccomment: [rule(/[^\/*]+/, "comment.doc"), rule(/\/\*/, "comment.doc.invalid"), rule(/\*\//, "comment.doc", "@pop"), rule(/[\/*]/, "comment.doc")],
  string: [rule(/[^\\"]+/, "string"), rule(GO_ESCAPES, "string.escape"), rule(/\\./, "string.escape.invalid"), rule(/"/, "string", "@pop")],
  rawstring: [rule(/[^\`]/, "string"), rule(/`/, "string", "@pop")],
};

const GRAMMARS: Record<HighlightLanguage, Record<string, Rule[]>> = { python: PYTHON, go: GO };

// Monaco's vs-dark rules: the longest dot-separated prefix of a token name picks its colour.
const THEME: Record<string, string> = {
  "": "#d4d4d4", invalid: "#f44747", comment: "#608b4e", number: "#b5cea8", "number.hex": "#5bb498", annotation: "#cc6666",
  delimiter: "#dcdcdc", tag: "#569cd6", string: "#ce9178", keyword: "#569cd6", "keyword.flow": "#c586c0",
};
function themeColor(token: string): string {
  for (let parts = token.split("."); parts.length; parts.pop()) {
    const color = THEME[parts.join(".")];
    if (color) return color;
  }
  return THEME[""];
}

// Bracket-pair colouring (on by default in Monaco): colour cycles with nesting depth, shared by
// all bracket kinds, and brackets inside strings and comments are ignored.
const BRACKET_COLORS = ["#ffd700", "#da70d6", "#179fff"];
const UNEXPECTED_BRACKET = "rgba(255, 18, 18, 0.8)";
const OPENERS: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSERS = new Set([")", "]", "}"]);
const noBrackets = (token: string) => /(^|\.)(comment|string|regex|regexp)(\.|$)/.test(token);

/** Highlight `code` into lines of coloured runs. */
export function highlightCode(code: string, language: HighlightLanguage): HighlightToken[][] {
  const grammar = GRAMMARS[language];
  const stack = ["root"];
  // Open brackets, with the token that drew each so it can be recoloured if it is never closed.
  const open: { close: string; token: HighlightToken }[] = [];
  const lines = code.split("\n").map(line => {
    const tokens: HighlightToken[] = [];
    let mergeable = false; // brackets get their own tokens so they can be recoloured
    const push = (text: string, color: string, bracket = false) => {
      const last = tokens[tokens.length - 1];
      if (!bracket && mergeable && last.color === color) { last.text += text; return; }
      tokens.push({ text, color });
      mergeable = !bracket;
      return tokens[tokens.length - 1];
    };
    const emit = (text: string, token: string) => {
      const color = themeColor(token);
      if (noBrackets(token)) { push(text, color); return; }
      for (const char of text) {
        if (OPENERS[char]) open.push({ close: OPENERS[char], token: push(char, BRACKET_COLORS[open.length % BRACKET_COLORS.length], true)! });
        else if (CLOSERS.has(char)) {
          // Like Monaco: close the nearest matching opener; any openers skipped over were never closed.
          let index = open.length - 1;
          while (index >= 0 && open[index].close !== char) index -= 1;
          if (index < 0) { push(char, UNEXPECTED_BRACKET, true); continue; }
          for (const skipped of open.splice(index + 1)) skipped.token.color = UNEXPECTED_BRACKET;
          open.pop();
          push(char, BRACKET_COLORS[index % BRACKET_COLORS.length], true);
        } else push(char, color);
      }
    };
    let pos = 0;
    while (pos < line.length) {
      const rest = line.slice(pos);
      let matched = false;
      for (const { re, token, next } of grammar[stack[stack.length - 1]]) {
        const match = re.exec(rest);
        if (!match || !match[0]) continue;
        emit(match[0], typeof token === "function" ? token(match[0]) : token);
        if (next === "@pop") { if (stack.length > 1) stack.pop(); }
        else if (next === "@popall") stack.length = 1;
        else if (next) stack.push(next);
        pos += match[0].length;
        matched = true;
        break;
      }
      if (!matched) { emit(line[pos], ""); pos += 1; } // Monarch's default token
    }
    return tokens;
  });
  for (const unclosed of open) unclosed.token.color = UNEXPECTED_BRACKET;
  return lines;
}
