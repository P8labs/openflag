import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";

import type { FeedComment } from "./types";
import { timeLabel } from "./utils";

type PostCommentsThreadProps = {
  postId: string;
  onCountChange?: (count: number) => void;
};

export function PostCommentsThread({
  postId,
  onCountChange,
}: PostCommentsThreadProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () =>
      apiFetch<{ comments: FeedComment[] }>(`/api/v1/posts/${postId}/comments`),
  });

  useEffect(() => {
    if (commentsQuery.data?.comments && onCountChange) {
      onCountChange(commentsQuery.data.comments.length);
    }
  }, [commentsQuery.data?.comments, onCountChange]);

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ comment: FeedComment }>(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({
        queryKey: ["post-comments", postId],
      });
    },
  });

  return (
    <div className="space-y-3 border-l border-border pl-4">
      <form
        className="flex items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const content = draft.trim();
          if (!content) {
            return;
          }
          commentMutation.mutate(content);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a comment"
          className="h-9 rounded-none rounded-l-md"
        />
        <Button
          className="rounded-none rounded-r-md h-9"
          type="submit"
          size="sm"
          disabled={commentMutation.isPending}
        >
          {commentMutation.isPending ? "Sending..." : "Send"}
        </Button>
      </form>

      {commentMutation.isError ? (
        <p className="text-xs text-destructive">
          {commentMutation.error instanceof Error
            ? commentMutation.error.message
            : "Could not post comment."}
        </p>
      ) : null}

      {commentsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : null}

      {commentsQuery.isError ? (
        <p className="text-xs text-destructive">
          {commentsQuery.error instanceof Error
            ? commentsQuery.error.message
            : "Could not load comments."}
        </p>
      ) : null}

      {!commentsQuery.isLoading && !commentsQuery.isError ? (
        <ul className="space-y-2">
          {(commentsQuery.data?.comments ?? []).map((comment) => (
            <li key={comment.id} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {comment.user?.name ?? user?.name ?? "User"} ·{" "}
                {timeLabel(comment.createdAt)}
              </p>
              <p className="text-sm text-foreground">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
