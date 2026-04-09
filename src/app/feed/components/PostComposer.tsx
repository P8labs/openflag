"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppViewer } from "@/components/providers";
import { Paperclip, GitPullRequest, Link2, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function PostComposer() {
  const viewer = useAppViewer();
  const [content, setContent] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [prUrl, setPrUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [showRepoInput, setShowRepoInput] = useState(false);
  const [showPrInput, setShowPrInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const userName = viewer.session?.user.name ?? "User";
  const avatar =
    viewer.profile?.avatar ?? viewer.session?.user.image ?? undefined;
  const initials = userName.slice(0, 2).toUpperCase();

  async function handlePost() {
    if (!content.trim() || isPosting) {
      return;
    }

    setIsPosting(true);
    setMessage(null);

    try {
      await apiFetch<{ post: { id: string } }>("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: attachmentName
            ? `${content}${imageUrl ? `\n\nImage: ${imageUrl}` : ""}\n\nAttachment: ${attachmentName}`
            : `${content}${imageUrl ? `\n\nImage: ${imageUrl}` : ""}`,
          githubRepoUrl: repoUrl || null,
          githubPrUrl: prUrl || null,
        }),
      });
      setContent("");
      setRepoUrl("");
      setPrUrl("");
      setImageUrl("");
      setAttachmentName("");
      setShowRepoInput(false);
      setShowPrInput(false);
      setShowImageInput(false);
      setMessage("Posted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to post.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="w-full px-4 py-3">
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 rounded-xs">
          <AvatarImage alt={userName} src={avatar} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder="Share your work, progress, or thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center text-muted-foreground">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowRepoInput((current) => !current)}
              >
                <Link2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPrInput((current) => !current)}
              >
                <GitPullRequest className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowImageInput((current) => !current)}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon-sm" asChild>
                <label>
                  <input
                    className="hidden"
                    type="file"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      setAttachmentName(selected?.name ?? "");
                    }}
                  />
                  <Paperclip className="h-4 w-4" />
                </label>
              </Button>
            </div>

            <Button
              size="sm"
              disabled={!content.trim() || isPosting}
              onClick={handlePost}
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
          {showRepoInput ? (
            <Input
              className="mt-2"
              placeholder="GitHub repository URL"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />
          ) : null}
          {showPrInput ? (
            <Input
              className="mt-2"
              placeholder="GitHub PR URL"
              value={prUrl}
              onChange={(event) => setPrUrl(event.target.value)}
            />
          ) : null}
          {showImageInput ? (
            <Input
              className="mt-2"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          ) : null}
          {attachmentName ? (
            <p className="pt-2 text-xs text-muted-foreground">
              Attached: {attachmentName}
            </p>
          ) : null}
          {message ? (
            <p className="pt-2 text-xs text-muted-foreground">{message}</p>
          ) : null}
        </div>
      </div>

      <Separator className="mt-3" />
    </div>
  );
}
