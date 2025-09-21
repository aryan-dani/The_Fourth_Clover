import * as z from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  status: z.enum(["draft", "published"]),
  tags: z.string().optional(),
  cover_image: z.string().url().optional().or(z.literal("")),
  excerpt: z
    .string()
    .max(300, "Excerpt must be less than 300 characters")
    .optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  featured_image: z.string().url().optional().nullable(),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),
  avatar_url: z.string().url("Invalid URL").optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable(),
  twitter: z
    .string()
    .max(50, "Twitter handle is too long")
    .optional()
    .nullable(),
  github: z
    .string()
    .max(50, "GitHub username is too long")
    .optional()
    .nullable(),
});
