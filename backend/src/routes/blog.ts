import { Hono } from "hono";
import { decode, verify, sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
  createBlogSchema,
  updateBlogSchema,
} from "@moresagar/cohort-class-common";

const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  try {
    const isVerified = await verify(
      c.req.header("authorization") || "",
      c.env.JWT_SECRET
    );
    if (isVerified && isVerified.id) {
      c.set("userId", isVerified.id);
      await next();
    } else {
      c.status(403);
      return c.json({ msg: "Unauthorized access." });
    }
  } catch (err) {
    return c.json({ err });
  }
});

blogRouter.post("/", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const parsed = await createBlogSchema.safeParseAsync(body);
    if (!parsed.success) {
      return c.json({ msg: "Please send valid body." });
    }

    const blog = await prisma.post.create({
      data: {
        authorId: c.get("userId"),
        title: body.title,
        content: body.content,
      },
    });
    return c.json({ blog });
  } catch (err) {
    return c.json({ err });
  }
});

blogRouter.put("/", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const parsed = await updateBlogSchema.safeParseAsync(body);
    if (!parsed.success) {
      return c.json({ msg: "Please send valid body." });
    }
    const blog = await prisma.post.update({
      where: { id: body.id, authorId: c.get("userId") },
      data: {
        ...body,
      },
    });

    return c.json({ blog });
  } catch (err) {
    return c.json({ err });
  }
});

blogRouter.get("/:id", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findMany({
      where: { id: c.req.param("id") }, select: {
        content: true,
        title: true,
        id: true,
        author: {
            select: {
                name: true
            }
        }
      }
    });

    return c.json({ blog });
  } catch (err) {
    return c.json({ err });
  }
});

blogRouter.get("/", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany({
      select: {
        content: true,
        title: true,
        id: true,
        author: {
            select: {
                name: true
            }
        }
      }
    });

    return c.json({ blogs });
  } catch (err) {
    return c.json({ err });
  }
});

export default blogRouter;
