import { usePostComposer } from "@/components/posts/PostComposerProvider";
import { useEffect } from "react";

export default function CreatePostPage() {
  const { openComposer } = usePostComposer();

  useEffect(() => {
    openComposer("/app");
  }, [openComposer]);

  return null;
}
