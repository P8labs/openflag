import { z } from "zod";

import { projectStatuses } from "@/lib/project-status";

export const projectFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required."),
  description: z.string().trim().min(10, "Description is required."),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  wakatimeId: z.string().trim().optional().or(z.literal("")),
  tags: z.string().trim().optional().or(z.literal("")),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const onboardingStepOneSchema = z.object({
  username: z.string().trim().min(3, "Username is required."),
  bio: z.string().trim().min(1, "Bio is required."),
  skills: z.array(z.string().trim()).default([]),
  interests: z.array(z.string().trim()).default([]),
});

export const onboardingStepTwoSchema = z.object({
  availability: z.string().trim().optional().or(z.literal("")),
  lookingFor: z.string().trim().optional().or(z.literal("")),
});

export const onboardingStepThreeSchema = z.object({
  wakatimeApiKey: z.string().trim().optional().or(z.literal("")),
});

export const createProjectComposerSchema = z.object({
  title: z.string().trim().min(2, "Project title is required."),
  summary: z.string().trim().min(8, "A short summary is required."),
  description: z.string().trim().min(20, "Description is too short."),
  status: z.enum(projectStatuses).default("dev"),
  logoUrl: z.string().trim().min(1, "Logo URL is required.").default("?"),
  projectUrl: z.string().trim().url().optional().or(z.literal("")),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  videoUrl: z.string().trim().url().optional().or(z.literal("")),
  tags: z.array(z.string().trim()).default([]),
  wakatimeProjectIds: z.array(z.string().trim()).default([]),
});

export type OnboardingStepOneValues = z.infer<typeof onboardingStepOneSchema>;
export type OnboardingStepTwoValues = z.infer<typeof onboardingStepTwoSchema>;
export type OnboardingStepThreeValues = z.infer<
  typeof onboardingStepThreeSchema
>;

export type OnboardingStepValues = OnboardingStepOneValues &
  OnboardingStepTwoValues &
  OnboardingStepThreeValues;

export type CreateProjectComposerValues = z.infer<
  typeof createProjectComposerSchema
>;

export type UpdateProjectComposerValues = z.infer<
  typeof createProjectComposerSchema
>;

export const postCategories = [
  "devlog",
  "thought",
  "show",
  "event",
  "ask",
] as const;

export const createPostComposerSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Post content is required.")
    .max(5000, "Post content is too long."),
  category: z.enum(postCategories).default("devlog"),
  projectId: z.string().trim().optional().or(z.literal("")),
  quiz: z.string().trim().optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  refUrls: z.array(z.string().trim()).default([]),
  wakatimeProjectIds: z.array(z.string().trim()).default([]),
});

export type CreatePostComposerValues = z.infer<typeof createPostComposerSchema>;
