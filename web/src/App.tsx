import { useEffect, useMemo, useState } from "react";

type RepoRun = {
  id: number;
  repoUrl: string;
  frameworks: string[];
  graphEdges: number;
  scannedAt: string;
};

type FeatureMap = {
  name: string;
  fileCount: number;
  functionCount: number;
  dependencies: string[];
  entrypoints: string[];
};

type EntryFlow = {
  entrypoint: string;
  exit: string;
  features: string[];
  functions: string[];
};

type CodebaseMap = {
  overview: {
    files: number;
    functions: number;
    calls: number;
    imports: number;
    edges: number;
  };
  features: FeatureMap[];
  entryFlows: EntryFlow[];
};

type Summary = {
  entries: string[];
  exits: string[];
};

const initialRepo = "https://github.com/PriyanshuPz/edunotify.git";

export default function App() {
  const [repoUrl, setRepoUrl] = useState(initialRepo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [map, setMap] = useState<CodebaseMap | null>(null);
  const [runs, setRuns] = useState<RepoRun[]>([]);
  const [markdownMap, setMarkdownMap] = useState("");

  const latestRun = runs[0];

  const stack = useMemo(() => {
    if (!latestRun?.frameworks?.length) {
      return "Unknown";
    }
    return latestRun.frameworks.join(", ");
  }, [latestRun]);

  const projectDescription = useMemo(() => {
    if (!map) {
      return "Analyze a repository to build a readable map of architecture, flow, and features.";
    }
    const topFeature = map.features?.[0]?.name ?? "core";
    return `This codebase is organized around ${topFeature} and ${map.features.length} total feature domains.`;
  }, [map]);

  async function loadAll() {
    const [summaryRes, mapRes, runsRes, mdRes] = await Promise.all([
      fetch("/api/summary"),
      fetch("/api/map"),
      fetch("/api/runs"),
      fetch("/artifacts/codebase_map.md"),
    ]);

    if (!summaryRes.ok || !mapRes.ok || !runsRes.ok) {
      throw new Error("Could not load analysis results.");
    }

    setSummary(await summaryRes.json());
    setMap(await mapRes.json());
    setRuns(await runsRes.json());

    if (mdRes.ok) {
      setMarkdownMap(await mdRes.text());
    } else {
      setMarkdownMap("");
    }
  }

  useEffect(() => {
    loadAll().catch(() => {
      // Keep page usable even before first analysis.
    });
  }, []);

  async function onAnalyze() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await loadAll();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analyze failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
    } catch {
      setError("Clipboard copy failed.");
    }
  }

  const primaryFlow = map?.entryFlows?.[0];

  return (
    <div className="page">
      <section className="top">
        <h1>OpenFlag</h1>
        <div className="inputRow">
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste GitHub repository URL..."
          />
          <button onClick={onAnalyze} disabled={loading || !repoUrl.trim()}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className={`results ${map ? "visible" : ""}`}>
        <div className="section">
          <h2>Summary</h2>
          <p className="desc">{projectDescription}</p>
          <p className="metaLine">Stack: {stack}</p>
          <p className="metaLine entry">
            Entry: {primaryFlow?.entrypoint ?? summary?.entries?.[0] ?? "N/A"}
          </p>
        </div>

        <div className="section">
          <h2>Flow</h2>
          {primaryFlow ? (
            <div className="flow">
              <FlowStep
                label="Start"
                file={primaryFlow.entrypoint}
                onCopy={copyPath}
              />
              {primaryFlow.features.slice(0, 4).map((feature, i) => (
                <FlowStep
                  key={feature + i}
                  label={featureLabel(feature)}
                  file={feature}
                  onCopy={copyPath}
                />
              ))}
              <FlowStep
                label="Exit"
                file={primaryFlow.exit || "(no explicit exit)"}
                onCopy={copyPath}
              />
            </div>
          ) : (
            <p className="muted">No flow map available yet.</p>
          )}
        </div>

        <div className="section">
          <h2>Features</h2>
          {map?.features?.slice(0, 10).map((feature) => (
            <div className="featureGroup" key={feature.name}>
              <div className="featureTitle">{feature.name}</div>
              <ul>
                {feature.entrypoints.slice(0, 4).map((f) => (
                  <li key={f}>
                    <button className="linkBtn" onClick={() => copyPath(f)}>
                      {f}
                    </button>
                  </li>
                ))}
                {feature.entrypoints.length === 0 ? (
                  <li className="muted">No direct entry files</li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>

        <div className="section">
          <h2>Dependencies</h2>
          <div className="deps">
            <div>
              <h3>Core</h3>
              <ul>
                {collectDeps(map, false).map((dep) => (
                  <li key={dep}>{dep}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Dev tools</h3>
              <ul>
                {collectDeps(map, true).map((dep) => (
                  <li key={dep}>{dep}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Codebase Map (Markdown)</h2>
          <pre className="mdBox">
            {markdownMap || "Markdown map not available yet."}
          </pre>
        </div>
      </section>
    </div>
  );
}

function FlowStep({
  label,
  file,
  onCopy,
}: {
  label: string;
  file: string;
  onCopy: (s: string) => void;
}) {
  return (
    <div className="flowStep">
      <div className="dot" />
      <div className="flowContent">
        <div className="flowLabel">{label}</div>
        <button
          className="pathBtn"
          onClick={() => onCopy(file)}
          title="Copy path"
        >
          {file}
        </button>
      </div>
    </div>
  );
}

function featureLabel(name: string) {
  if (name.startsWith("vendor:")) {
    return "Dependency";
  }
  if (name.includes("api")) {
    return "API";
  }
  if (name.includes("db") || name.includes("lib")) {
    return "Data";
  }
  if (name.includes("hooks") || name.includes("logic")) {
    return "Logic";
  }
  return "Feature";
}

function collectDeps(map: CodebaseMap | null, devTools: boolean) {
  if (!map?.features?.length) {
    return ["N/A"];
  }

  const toolMarkers = [
    "eslint",
    "vite",
    "typescript",
    "tailwind",
    "babel",
    "vitest",
    "jest",
  ];
  const all = new Set<string>();

  for (const feature of map.features) {
    for (const dep of feature.dependencies || []) {
      if (!dep.startsWith("vendor:")) {
        continue;
      }
      const normalized = dep.replace("vendor:", "");
      const isTool = toolMarkers.some((k) => normalized.includes(k));
      if (devTools ? isTool : !isTool) {
        all.add(normalized);
      }
    }
  }

  const list = [...all].sort();
  if (!list.length) {
    return ["N/A"];
  }
  return list.slice(0, 14);
}
