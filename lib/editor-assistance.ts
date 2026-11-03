import type { Monaco } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";

const configured = new WeakSet<object>();
const keywords = "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case".split(" ");
const builtins = "abs all any bin bool breakpoint bytearray bytes callable chr classmethod complex dict dir divmod enumerate filter float format frozenset getattr hasattr hash help hex id input int isinstance issubclass iter len list map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip __import__".split(" ");
const snippets = [
  { label: "def", detail: "Function definition", insertText: "def ${1:name}(${2}):\n\t${0:pass}" },
  { label: "for", detail: "For loop", insertText: "for ${1:item} in ${2:items}:\n\t${0:pass}" },
  { label: "if", detail: "If statement", insertText: "if ${1:condition}:\n\t${0:pass}" },
  { label: "class", detail: "Class definition", insertText: "class ${1:Name}:\n\t${0:pass}" },
  { label: "try", detail: "Try / except", insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:error}:\n\t${0:pass}" },
];

/** Register once per Monaco instance, even when several editors are mounted. */
export function configureEditorAssistance(monaco: Monaco) {
  if (configured.has(monaco)) return;
  configured.add(monaco);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSyntaxValidation: false, noSemanticValidation: false });
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({ allowJs: true, checkJs: true, allowNonTsExtensions: true, noEmit: true, target: monaco.languages.typescript.ScriptTarget.Latest });
  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems(model: editor.ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      return { suggestions: [
        ...keywords.map(label => ({ label, kind: monaco.languages.CompletionItemKind.Keyword, insertText: label, range })),
        ...builtins.map(label => ({ label, kind: monaco.languages.CompletionItemKind.Function, detail: "Python built-in", insertText: label, range })),
        ...snippets.map(snippet => ({ ...snippet, label: `${snippet.label} (snippet)`, filterText: snippet.label, kind: monaco.languages.CompletionItemKind.Snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range })),
      ] };
    },
  });
}
