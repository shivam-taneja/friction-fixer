export const frameworkChoices = [
  { id: "next", label: "Next.js" },
  { id: "nuxt", label: "Nuxt" },
  { id: "sveltekit", label: "SvelteKit" },
  { id: "remix", label: "Remix" },
  { id: "astro", label: "Astro" },
  { id: "gatsby", label: "Gatsby" },
  { id: "angular", label: "Angular" },
  { id: "cra", label: "Create React App" },
  { id: "vite", label: "Vite" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
  { id: "html", label: "HTML" },
  { id: "other", label: "Other" },
] as const;

export type FrameworkId = (typeof frameworkChoices)[number]["id"];

const folderCandidates: Record<FrameworkId, string[]> = {
  next: ["src/app", "app", "src/pages", "pages", "src"],
  nuxt: ["app", "pages"],
  sveltekit: ["src/routes", "src"],
  remix: ["app"],
  astro: ["src/pages", "src"],
  gatsby: ["src/pages", "src"],
  angular: ["src"],
  cra: ["src"],
  vite: ["src"],
  vue: ["src"],
  svelte: ["src"],
  html: ["."],
  other: ["src", "."],
};

export const repoRootFolder = ".";

export type ProjectPreset = {
  framework: FrameworkId;
  folders: string[];
  defaults: Record<FrameworkId, string>;
  defaultFound: Record<FrameworkId, boolean>;
};

export function frameworkLabel(id: string) {
  return frameworkChoices.find((choice) => choice.id === id)?.label ?? id;
}

export function isFrameworkId(value: string): value is FrameworkId {
  return frameworkChoices.some((choice) => choice.id === value);
}

export function folderLabel(path: string) {
  return path === repoRootFolder ? "Repository root" : path;
}

export function isRepoFolder(value: string) {
  if (value === repoRootFolder) return true;
  if (!value || value.length > 300) return false;
  if (value.startsWith("/") || value.includes("\\") || value.includes("..")) {
    return false;
  }
  return value.split("/").every((part) => part.length > 0 && part !== ".");
}

export function describeProject(
  paths: string[],
  dependencies: string[],
  folders: string[],
) {
  const files = new Set(paths);
  const deps = new Set(dependencies);
  const folderSet = new Set(folders);
  folderSet.add(repoRootFolder);
  const framework = detectFramework(files, deps);
  const defaults = {} as Record<FrameworkId, string>;
  const defaultFound = {} as Record<FrameworkId, boolean>;

  for (const choice of frameworkChoices) {
    const resolved = defaultFolder(choice.id, folderSet);
    defaults[choice.id] = resolved.path;
    defaultFound[choice.id] = resolved.found;
  }

  const preset: ProjectPreset = {
    framework,
    folders: [...folderSet]
      .filter(isListedFolder)
      .sort((a, b) => {
        if (a === repoRootFolder) return -1;
        if (b === repoRootFolder) return 1;
        return a.localeCompare(b);
      }),
    defaults,
    defaultFound,
  };
  return preset;
}

function detectFramework(paths: Set<string>, deps: Set<string>): FrameworkId {
  if (deps.has("next") || hasRootConfig(paths, "next.config.")) return "next";
  if (deps.has("nuxt") || hasRootConfig(paths, "nuxt.config.")) return "nuxt";
  if (deps.has("@sveltejs/kit")) return "sveltekit";
  if (
    deps.has("@remix-run/dev") ||
    deps.has("@remix-run/react") ||
    deps.has("@remix-run/node") ||
    deps.has("@remix-run/serve")
  ) {
    return "remix";
  }
  if (deps.has("astro") || hasRootConfig(paths, "astro.config.")) return "astro";
  if (deps.has("gatsby")) return "gatsby";
  if (deps.has("@angular/core")) return "angular";
  if (deps.has("react-scripts")) return "cra";
  if (deps.has("vite") || hasRootConfig(paths, "vite.config.")) return "vite";
  if (deps.has("vue")) return "vue";
  if (deps.has("svelte")) return "svelte";
  if (paths.has("index.html")) return "html";
  return "other";
}

function defaultFolder(framework: FrameworkId, folders: Set<string>) {
  const candidates = folderCandidates[framework];
  const found = candidates.find((path) => folders.has(path));
  return { path: found ?? candidates[0], found: Boolean(found) };
}

function isListedFolder(path: string) {
  if (path === repoRootFolder) return true;
  const ignored = new Set([
    "node_modules",
    "dist",
    "build",
    "coverage",
    "vendor",
    "out",
  ]);
  return path.split("/").every((part) => {
    return part.length > 0 && !part.startsWith(".") && !ignored.has(part);
  });
}

function hasRootConfig(paths: Set<string>, prefix: string) {
  for (const path of paths) {
    if (!path.includes("/") && path.startsWith(prefix)) return true;
  }
  return false;
}
