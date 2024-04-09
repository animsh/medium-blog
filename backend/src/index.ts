import { Hono } from "hono";
import { decode, verify, sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
  Variables: {
    userId: string;
  };
}>();
const apiV1BaseUrl = "/api/v1";

app.use(`${apiV1BaseUrl}/blogs/*`, async (c, next) => {
  try {
    const isVerified = await verify(
      c.req.header("authorization") || "",
      "secret "
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

// app.use("/*", async (c, next) => {
//   const prisma = new PrismaClient({
//     datasourceUrl: c.env.DATABASE_URL,
//   }).$extends(withAccelerate());

//   c.set("prisma", prisma);
//   await next();
// });

app.post(`${apiV1BaseUrl}/signup`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const already = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (already) return c.json({ msg: "User email already in use!" });

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
      },
    });

    const token = await sign({ id: user.id }, "secret ");

    return c.json({ msg: "User found!", token });
  } catch (err) {
    return c.json({ msg: "Please send valid body.", err });
  }
});

app.post(`${apiV1BaseUrl}/signin`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const already = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!already) return c.json({ msg: "User does not exist!" });

    if (already.password !== body.password)
      return c.json({ msg: "Invalid password." });

    const token = await sign({ id: already.id }, "secret ");

    return c.json({ msg: "User created!", token });
  } catch (err) {
    return c.json({ msg: "Please send valid body.", err });
  }
});

app.post(`${apiV1BaseUrl}/blogs`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

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

app.put(`${apiV1BaseUrl}/blogs`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    console.log(body);
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

app.get(`${apiV1BaseUrl}/blogs/:id`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blog = await prisma.post.findMany({
      where: { id: c.req.param("id") },
    });

    return c.json({ blog });
  } catch (err) {
    return c.json({ err });
  }
});

app.get(`${apiV1BaseUrl}/blogs`, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const blogs = await prisma.post.findMany({});

    return c.json({ blogs });
  } catch (err) {
    return c.json({ err });
  }
});

export default app;
