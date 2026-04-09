"use client";

import Link from "next/link";
import { Avatar, Button, Card, Chip, Input, TextArea } from "@heroui/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

type DevlogItem = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  recentActivityAt: string;
  owner: {
    name: string;
    username: string;
    avatar: string | null;
  };
};

type Props = {
  initialItems: DevlogItem[];
  currentUser: {
    name: string;
    username: string;
    avatar: string | null;
  };
};

type DevlogComment = {
  id: string;
  text: string;
  authorName: string;
  authorUsername: string;
  createdAt: string;
};

const COMMENTS_STORAGE_KEY = "openflag-devlog-comments";

function fromNow(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(delta / (1000 * 60));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function buildTitle(content: string) {
  const clean = content.trim();
  if (!clean) return "Devlog update";
  return clean.split(/\s+/).slice(0, 8).join(" ").slice(0, 64);
}

export function DevlogFeed({ initialItems, currentUser }: Props) {
  const [items, setItems] = useState(initialItems);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(
    null,
  );
  const [draftComment, setDraftComment] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, DevlogComment[]>
  >({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, DevlogComment[]>;
      setCommentsByPost(parsed);
    } catch {
      setCommentsByPost({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      COMMENTS_STORAGE_KEY,
      JSON.stringify(commentsByPost),
    );
  }, [commentsByPost]);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <Avatar size="md">
          <Avatar.Image
            alt={currentUser.name}
            src={currentUser.avatar ?? undefined}
          />
          <Avatar.Fallback>
            {currentUser.name.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
        <form>
          <TextArea
            rows={5}
            placeholder="Share a devlog update..."
            value={content}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setContent(event.target.value)
            }
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Post concise updates like a timeline.
            </p>
            <Button
              isDisabled={isPosting || !content.trim()}
              type="submit"
              variant="primary"
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
      </div>

      <section className="space-y-0">
        {items.map((item) => (
          <Card
            key={item.id}
            className="rounded-xs border border-border bg-surface"
            variant="default"
          >
            <Card.Content className="p-4">
              <div className="flex items-start gap-3">
                <Avatar size="sm">
                  <Avatar.Image
                    alt={item.owner.name}
                    src={item.owner.avatar ?? undefined}
                  />
                  <Avatar.Fallback>
                    {item.owner.name.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <p className="font-semibold">{item.owner.name}</p>
                    <Link
                      className="text-muted hover:underline"
                      href={`/${item.owner.username}`}
                    >
                      @{item.owner.username}
                    </Link>
                    <span className="text-muted">·</span>
                    <p className="text-muted">
                      {fromNow(item.recentActivityAt)}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">
                    {item.description}
                  </p>
                  {item.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.slice(0, 6).map((tag) => (
                        <Chip
                          key={`${item.id}-${tag}`}
                          size="sm"
                          variant="soft"
                        >
                          #{tag}
                        </Chip>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        setOpenCommentPostId((current) =>
                          current === item.id ? null : item.id,
                        );
                        setDraftComment("");
                      }}
                    >
                      Comment ({commentsByPost[item.id]?.length ?? 0})
                    </Button>
                  </div>

                  {openCommentPostId === item.id ? (
                    <form
                      className="mt-3 space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault();

                        const nextText = draftComment.trim();
                        if (!nextText) {
                          return;
                        }

                        const nextComment: DevlogComment = {
                          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                          text: nextText,
                          authorName: currentUser.name,
                          authorUsername: currentUser.username,
                          createdAt: new Date().toISOString(),
                        };

                        setCommentsByPost((prev) => ({
                          ...prev,
                          [item.id]: [...(prev[item.id] ?? []), nextComment],
                        }));
                        setDraftComment("");
                      }}
                    >
                      <Input
                        placeholder="Write a comment"
                        value={draftComment}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setDraftComment(event.target.value)
                        }
                      />
                      <div className="flex justify-end">
                        <Button
                          isDisabled={!draftComment.trim()}
                          size="sm"
                          type="submit"
                          variant="primary"
                        >
                          Add comment
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {(commentsByPost[item.id] ?? []).length ? (
                    <div className="mt-3 space-y-2">
                      {(commentsByPost[item.id] ?? []).map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-xs border border-border bg-default p-2.5"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <p className="font-medium">{comment.authorName}</p>
                            <Link
                              className="text-muted hover:underline"
                              href={`/${comment.authorUsername}`}
                            >
                              @{comment.authorUsername}
                            </Link>
                            <span className="text-muted">·</span>
                            <p className="text-muted">
                              {fromNow(comment.createdAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-foreground/85">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
        {!items.length ? (
          <Card
            className="rounded-xs border border-border bg-default"
            variant="default"
          >
            <Card.Content className="px-4 py-5 text-sm text-muted">
              No devlogs yet. Post your first update above.
            </Card.Content>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
