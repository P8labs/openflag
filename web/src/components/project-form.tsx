import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { projectFormSchema, type ProjectFormValues } from "@/lib/schemas";

type ProjectPayload = {
  project: {
    id: string;
    title: string;
    description: string;
    githubUrl: string | null;
    wakatimeId: string | null;
    tags: string[];
    createdAt: string;
  };
};

export function ProjectForm() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      githubUrl: "",
      wakatimeId: "",
      tags: "",
    },
  });

  const createProject = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      apiFetch<ProjectPayload>("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          githubUrl: values.githubUrl || null,
          wakatimeId: values.wakatimeId || null,
          tags: values.tags
            ? values.tags
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
        }),
      }),
    onSuccess: async () => {
      setMessage("Project created.");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    },
  });

  const submitLabel = useMemo(
    () => (createProject.isPending ? "Publishing..." : "Publish update"),
    [createProject.isPending],
  );

  return (
    <Card className="composer-card">
      <CardHeader>
        <div className="composer-title-row">
          <div>
            <Badge variant="soft">Composer</Badge>
            <CardTitle>Share a project update</CardTitle>
            <CardDescription>
              Use the same post surface for launches, progress logs, and linked
              work.
            </CardDescription>
          </div>
          <Badge variant="outline">React Hook Form + zod</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form
          className="stack-gap"
          onSubmit={form.handleSubmit((values) => createProject.mutate(values))}
        >
          <label className="field">
            <span>Title</span>
            <Input {...form.register("title")} placeholder="Signal Board" />
            {form.formState.errors.title ? (
              <small>{form.formState.errors.title.message}</small>
            ) : null}
          </label>

          <label className="field">
            <span>Description</span>
            <Textarea
              {...form.register("description")}
              placeholder="Explain the work, the proof, and what you need next."
              rows={5}
            />
            {form.formState.errors.description ? (
              <small>{form.formState.errors.description.message}</small>
            ) : null}
          </label>

          <div className="grid-two">
            <label className="field">
              <span>GitHub URL</span>
              <Input
                {...form.register("githubUrl")}
                placeholder="https://github.com/..."
              />
            </label>

            <label className="field">
              <span>WakaTime ID</span>
              <Input
                {...form.register("wakatimeId")}
                placeholder="wakatime-project-id"
              />
            </label>
          </div>

          <label className="field">
            <span>Tags</span>
            <Input
              {...form.register("tags")}
              placeholder="developer-tools, saas, ai"
            />
          </label>

          <div className="composer-actions">
            <Button type="submit" disabled={createProject.isPending}>
              {submitLabel}
            </Button>
            {message ? <p className="helper-text">{message}</p> : null}
          </div>
        </form>
      </CardContent>

      <CardFooter className="composer-footer">
        <p className="helper-text">
          This writes directly to the Go API and refreshes the feed.
        </p>
      </CardFooter>
    </Card>
  );
}
