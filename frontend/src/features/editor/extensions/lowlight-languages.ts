import { common, createLowlight } from "lowlight";
import dockerfile from "highlight.js/lib/languages/dockerfile";

export const lowlight = createLowlight(common);
lowlight.register("dockerfile", dockerfile);

export type SupportedLanguage = {
  id: string;
  name: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: "typescript", name: "TypeScript" },
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "rust", name: "Rust" },
  { id: "go", name: "Go" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" },
  { id: "sql", name: "SQL" },
  { id: "bash", name: "Bash / Shell" },
  { id: "json", name: "JSON" },
  { id: "yaml", name: "YAML" },
  { id: "markdown", name: "Markdown" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "java", name: "Java" },
  { id: "csharp", name: "C#" },
  { id: "dockerfile", name: "Dockerfile" },
  { id: "graphql", name: "GraphQL" },
  { id: "kotlin", name: "Kotlin" },
  { id: "ruby", name: "Ruby" },
  { id: "swift", name: "Swift" },
  { id: "ini", name: "TOML / Config" },
  { id: "diff", name: "Git Diff" },
  { id: "plaintext", name: "Plain Text" },
];
