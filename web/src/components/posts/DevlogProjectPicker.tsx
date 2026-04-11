import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DevlogProject = {
  id: string;
  title: string;
  summary: string;
  wakatimeIds: string[];
  githubUrl?: string | null;
};

type DevlogProjectPickerProps = {
  open: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  projects: DevlogProject[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onClose: () => void;
};

export function DevlogProjectPicker({
  open,
  search,
  onSearchChange,
  projects,
  selectedProjectId,
  onSelectProject,
  onClose,
}: DevlogProjectPickerProps) {
  if (!open) {
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProjects =
    normalizedSearch.length === 0
      ? projects
      : projects.filter((project) => {
          return (
            project.title.toLowerCase().includes(normalizedSearch) ||
            project.summary.toLowerCase().includes(normalizedSearch) ||
            project.id.toLowerCase().includes(normalizedSearch)
          );
        });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-md border border-border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-medium">Select project</p>
            <p className="text-xs text-muted-foreground">
              Choose a project to attach tracked time to this devlog.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-md"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by project title, summary, or id"
        />

        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredProjects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No projects found.</p>
          ) : (
            filteredProjects.map((project) => {
              const selected = selectedProjectId === project.id;

              return (
                <button
                  key={project.id}
                  type="button"
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.summary}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
                      {project.wakatimeIds.length} sources
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="rounded-md" onClick={onClose} type="button">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
