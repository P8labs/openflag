export default function App() {
  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h1 style={styles.title}>OpenFlag</h1>
        <p style={styles.tagline}>Understand any codebase in seconds.</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>Manifesto</h2>
          <p style={styles.text}>
            Developers waste hours trying to understand unfamiliar codebases.
            Reading files, jumping between folders, guessing architecture.
          </p>
          <p style={styles.text}>OpenFlag exists to eliminate that friction.</p>
          <p style={styles.text}>
            Paste a repository. Instantly see what matters — entry points,
            structure, dependencies, and flow.
          </p>
          <p style={styles.text}>No noise. No guessing. Just clarity.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>Vision</h2>
          <p style={styles.text}>
            Codebases should be explorable like maps, not puzzles.
          </p>
          <p style={styles.text}>
            OpenFlag will become the fastest way to understand any system — from
            small projects to large production codebases.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>Roadmap</h2>

          <ul style={styles.list}>
            <li>✔ Repo summary + tech stack detection</li>
            <li>✔ Entry point identification</li>
            <li>✔ Dependency and tool detection</li>
            <li>⏳ Program flow mapping (entry → core → exit)</li>
            <li>⏳ Feature grouping (auth, API, DB, etc.)</li>
            <li>⏳ Q&A over codebase</li>
            <li>⏳ GitHub integration + caching</li>
          </ul>
        </section>

        <div style={styles.footer}>
          <p>Building in public.</p>
          <p style={styles.muted}>openflag.xyz</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0f0f0f",
    color: "#eaeaea",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "system-ui, sans-serif",
  },
  wrapper: {
    maxWidth: "720px",
    width: "100%",
  },
  title: {
    fontSize: "40px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  tagline: {
    fontSize: "16px",
    color: "#aaa",
    marginBottom: "40px",
  },
  section: {
    marginBottom: "40px",
  },
  heading: {
    fontSize: "20px",
    marginBottom: "12px",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#ccc",
    marginBottom: "10px",
  },
  list: {
    paddingLeft: "18px",
    color: "#ccc",
    lineHeight: "1.8",
  },
  footer: {
    marginTop: "60px",
    borderTop: "1px solid #222",
    paddingTop: "20px",
    color: "#888",
    fontSize: "14px",
  },
  muted: {
    opacity: 0.6,
  },
};
