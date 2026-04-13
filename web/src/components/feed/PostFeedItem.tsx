import { CheckCircle2, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/ui/rich-text";
import { cn, formatDuration } from "@/lib/utils";

import { PostCommentsThread } from "./PostCommentsThread";
import type { FeedPost } from "./types";
import {
  parseQuizOptions,
  parseTypedRef,
  quizSummary,
  refChipMeta,
  shouldAutoOpenComments,
  timeLabel,
} from "./utils";

type PostFeedItemProps = {
  id: string;
  post: FeedPost;
  currentUserId?: string;
  commentCount: number;
  commentPanelOpen?: boolean;
  likePending: boolean;
  quizPending: boolean;
  quizError?: string | null;
  onLike: (postId: string) => void;
  onVoteQuiz: (postId: string, optionIndex: number) => void;
  onToggleComments: (postId: string) => void;
  onCommentCountChange: (postId: string, count: number) => void;
};

export function PostFeedItem({
  id,
  post,
  currentUserId,
  commentCount,
  commentPanelOpen,
  likePending,
  quizPending,
  quizError,
  onLike,
  onVoteQuiz,
  onToggleComments,
  onCommentCountChange,
}: PostFeedItemProps) {
  const likeCount = post.likes?.length ?? 0;
  const isLikedByCurrentUser = Boolean(
    currentUserId &&
    (post.likes ?? []).some((likedUser) => likedUser.id === currentUserId),
  );

  const refs = post.refUrls ?? [];
  const quizLabel = quizSummary(post.quiz);
  const quizOptions = parseQuizOptions(post.quiz);
  const quizVoteCounts =
    quizOptions?.options.map((_, optionIndex) => {
      return (post.quizVotes ?? []).filter(
        (vote) => vote.optionIndex === optionIndex,
      ).length;
    }) ?? [];
  const myQuizVote = post.myQuizVote ?? null;
  const commentsOpen =
    commentPanelOpen ?? shouldAutoOpenComments(post.id, commentCount);

  return (
    <li id={id} key={id} className="space-y-3 py-4 scroll-mt-24">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="mt-0.5 size-10 border border-border">
            {post.author?.image ? (
              <AvatarImage
                src={post.author.image}
                alt={post.author?.username ?? "user"}
              />
            ) : (
              <AvatarFallback>
                {(post.author?.name ?? "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">
              {post.author?.name ?? "Unknown"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              <Link
                to={`/${post.author?.username ?? "user"}`}
                className="hover:text-foreground hover:underline"
              >
                @{post.author?.username ?? "user"}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs">
          <Badge variant="soft">{post.category ?? "post"}</Badge>
          <span className="text-muted-foreground">
            {timeLabel(post.createdAt)}
          </span>
        </div>
      </div>

      <RichText
        text={post.content}
        className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
      />

      {post.image && (
        <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-md">
          <img
            src={post.image}
            alt="Post image"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {quizOptions ? (
        <section className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Pick one option. Voting is locked after submit.
          </p>

          <div className="first:rounded-t-md">
            {quizOptions.options.map((option, optionIndex) => {
              const count = quizVoteCounts[optionIndex] ?? 0;
              const selected = myQuizVote?.optionIndex === optionIndex;
              const totalVotes = quizVoteCounts.reduce(
                (sum, value) => sum + value,
                0,
              );
              const percentage =
                totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

              return (
                <button
                  key={`${post.id}-quiz-${optionIndex}`}
                  type="button"
                  disabled={Boolean(myQuizVote) || quizPending}
                  onClick={() => onVoteQuiz(post.id, optionIndex)}
                  className={cn(
                    "w-full border px-3 py-2 text-left transition-colors rounded-none first:rounded-t-md last:rounded-b-md",
                    selected
                      ? "border-primary/20 bg-primary/10"
                      : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                    myQuizVote && !selected && "opacity-70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selected ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <span className="size-4 rounded-full border border-border" />
                      )}
                      <span className="text-sm text-foreground">{option}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {count} · {percentage}%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {quizError ? (
            <p className="text-xs text-destructive">{quizError}</p>
          ) : null}
        </section>
      ) : null}

      {refs.length > 0 ||
      typeof post.devlogMinutes === "number" ||
      quizLabel ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {refs.length > 0
            ? refs.slice(0, 3).map((entry) => {
                const parsed = parseTypedRef(entry);
                const url = parsed?.url ?? entry;
                const meta = refChipMeta(entry);
                const Icon = meta.icon;

                return (
                  <a
                    key={entry}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors",
                      meta.className,
                    )}
                    title={url}
                  >
                    <Icon className="size-3.5" />
                    {meta.label}
                  </a>
                );
              })
            : null}
          {typeof post.devlogMinutes === "number" ? (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5">
              Tracked {formatDuration(post.devlogMinutes)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLike(post.id)}
            disabled={likePending}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
              isLikedByCurrentUser
                ? "text-rose-500"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart
              className={cn("size-4", isLikedByCurrentUser && "fill-current")}
            />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleComments(post.id)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            <span>{commentCount}</span>
          </button>
        </div>

        {post.project ? (
          <Link
            to={`/app/projects/${post.project.id}`}
            className="inline-flex max-w-45 items-center truncate rounded-full border border-border px-2.5 py-1 text-xs text-primary hover:bg-primary/5"
          >
            {post.project.title}
          </Link>
        ) : null}
      </div>

      {commentsOpen ? (
        <PostCommentsThread
          postId={post.id}
          onCountChange={(count) => onCommentCountChange(post.id, count)}
        />
      ) : null}
    </li>
  );
}
