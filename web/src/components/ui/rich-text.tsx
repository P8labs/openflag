import { Link } from "react-router-dom";

type RichTextProps = {
  text: string;
  className?: string;
};

const TOKEN_REGEX =
  /(@\{[a-zA-Z0-9_]+\}|@[a-zA-Z0-9_]+|(?:https?:\/\/|www\.)[^\s]+)/g;

function splitTrailingPunctuation(raw: string) {
  const match = raw.match(/^(.*?)([.,!?;:)\]]*)$/);
  if (!match) {
    return { core: raw, trailing: "" };
  }

  return {
    core: match[1] ?? raw,
    trailing: match[2] ?? "",
  };
}

function mentionTarget(token: string) {
  if (token.startsWith("@{")) {
    return token.slice(2, -1);
  }

  return token.slice(1);
}

function urlTarget(token: string) {
  if (token.startsWith("http://") || token.startsWith("https://")) {
    return token;
  }

  return `https://${token}`;
}

export function RichText({ text, className }: RichTextProps) {
  const parts = text.split(TOKEN_REGEX);

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }

        if (part.startsWith("@")) {
          const username = mentionTarget(part).trim();
          if (!username) {
            return <span key={`text-${index}`}>{part}</span>;
          }

          return (
            <Link
              key={`mention-${index}`}
              to={`/${username}`}
              className="text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }

        if (
          part.startsWith("http://") ||
          part.startsWith("https://") ||
          part.startsWith("www.")
        ) {
          const { core, trailing } = splitTrailingPunctuation(part);
          if (!core) {
            return <span key={`url-empty-${index}`}>{part}</span>;
          }

          return (
            <span key={`url-${index}`}>
              <a
                href={urlTarget(core)}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {core}
              </a>
              {trailing}
            </span>
          );
        }

        return <span key={`text-${index}`}>{part}</span>;
      })}
    </p>
  );
}
