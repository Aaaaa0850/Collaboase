import { z } from "zod";

export const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    projectTag: z.string(),
    seriousnessTag: z.string(),
    updatedAt: z.number(),
});

export const createProjectSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    projectTag: z.string(),
    seriousnessTag: z.string(),
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
