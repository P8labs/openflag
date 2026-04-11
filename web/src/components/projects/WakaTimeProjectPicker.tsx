import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type WakaTimeProject = {
  id: string;
  name: string;
};

type WakaTimeProjectPickerProps = {
  open: boolean;
  title?: string;
  description?: string;
  search: string;
  onSearchChange: (value: string) => void;
  projects: WakaTimeProject[];
  selectedProjectIds: string[];
  onToggleProject: (projectId: string) => void;
  onClose: () => void;
};

export function WakaTimeProjectPicker({
  open,
  title = "Select WakaTime projects",
  description = "Choose one or multiple projects to track time and devlogs.",
  search,
  onSearchChange,
  projects,
  selectedProjectIds,
  onToggleProject,
  onClose,
}: WakaTimeProjectPickerProps) {
  if (!open) {
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProjects =
    normalizedSearch.length === 0
      ? projects
      : projects.filter((item) => {
          return (
            item.name.toLowerCase().includes(normalizedSearch) ||
            item.id.toLowerCase().includes(normalizedSearch)
          );
        });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-md border border-border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
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
          placeholder="Search by project name or ID"
        />

        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredProjects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No projects found.</p>
          ) : (
            filteredProjects.map((item) => {
              const selected = selectedProjectIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                  onClick={() => onToggleProject(item.id)}
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.id}</p>
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
