import { CircleDot, GitMerge, Link2, type LucideIcon } from "lucide-react";

export function timeLabel(value: string) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) {
    return "Now";
  }

  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) {
    return "Now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return created.toLocaleDateString();
}

export function parseTypedRef(value: string) {
  const parts = value.split(":");
  if (parts.length < 2) {
    return null;
  }

  const type = parts[0]?.trim().toLowerCase() ?? "";
  const url = parts.slice(1).join(":").trim();
  if (!type || !url) {
    return null;
  }

  return { type, url };
}

export function shouldAutoOpenComments(postID: string, count: number) {
  if (count <= 3) {
    return false;
  }

  let hash = 0;
  for (let index = 0; index < postID.length; index += 1) {
    hash = (hash * 31 + postID.charCodeAt(index)) % 9973;
  }

  return hash % 2 === 0;
}

export function parseQuizOptions(quiz?: string | null) {
  if (!quiz) {
    return null;
  }

  try {
    const parsed = JSON.parse(quiz) as {
      type?: string;
      question?: string;
      options?: string[];
    };

    if (parsed?.type !== "mcq" || !Array.isArray(parsed.options)) {
      return null;
    }

    return {
      question: parsed.question ?? "Quiz",
      options: parsed.options,
    };
  } catch {
    return null;
  }
}

export function quizSummary(quiz?: string | null) {
  if (!quiz) {
    return "";
  }

  try {
    const parsed = JSON.parse(quiz) as {
      type?: string;
      options?: unknown[];
    };
    if (parsed?.type === "mcq") {
      const count = Array.isArray(parsed.options) ? parsed.options.length : 0;
      return count > 0 ? `Quiz · MCQ (${count})` : "Quiz · MCQ";
    }
  } catch {
    return "Quiz";
  }

  return "Quiz";
}

export function refChipMeta(entry: string): {
  label: string;
  icon: LucideIcon;
  className: string;
} {
  const parsed = parseTypedRef(entry);
  const type = parsed?.type ?? "ref";
  const url = parsed?.url ?? entry;

  try {
    const target = new URL(url);
    const segments = target.pathname.split("/").filter(Boolean);
    const tail = segments[segments.length - 1] ?? "";

    if (type === "pr") {
      return {
        label: tail ? `PR #${tail}` : "PR",
        icon: GitMerge,
        className: "bg-green-500/90 border-0 hover:bg-green-500 text-white",
      };
    }

    if (type === "issue") {
      return {
        label: tail ? `Issue #${tail}` : "Issue",
        icon: CircleDot,
        className: "border-0 bg-amber-500/90 hover:bg-amber-500 text-white",
      };
    }

    return {
      label: target.hostname,
      icon: Link2,
      className:
        "border-border bg-background text-muted-foreground hover:text-foreground",
    };
  } catch {
    return {
      label: type.toUpperCase(),
      icon: Link2,
      className: "border-border bg-background text-muted-foreground",
    };
  }
}
