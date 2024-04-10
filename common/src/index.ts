import { z } from "zod";

export const signupUserSchema = z.object({
  email: z.string().email(),
  name: z
    .string()
    .min(3, { message: "name length must be more that 3 chars." }),
  password: z
    .string()
    .min(6, { message: "password length must be 6 or more that 6." }),
});

export const signinUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: "password length must be 6 or more that 6." }),
});

export const createBlogSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlogSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
  id: z.string(),
});

export type SignupUser = z.infer<typeof signupUserSchema>;
export type SigninUser = z.infer<typeof signinUserSchema>;
export type CreateBlog = z.infer<typeof createBlogSchema>;
export type UpdateBlog = z.infer<typeof updateBlogSchema>;
