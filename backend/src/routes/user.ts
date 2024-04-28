import { Hono } from "hono";
import { sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
  signinUserSchema,
  signupUserSchema,
} from "@moresagar/cohort-class-common";

const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  try {
    console.log(c.env.DATABASE_URL)
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    console.log(prisma)
    const body = await c.req.json();

    const parsed = await signupUserSchema.safeParseAsync(body);
    if (!parsed.success) {
      return c.json({ msg: "Please send valid body." });
    }

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

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ msg: "User found!", token });
  } catch (err) {
    return c.json({ msg: "Please send valid body.", err });
  }
});

userRouter.post("signin", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();

    const parsed = await signinUserSchema.safeParseAsync(body);
    if (!parsed.success) {
      return c.json({ msg: "Please send valid body." });
    }

    const already = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!already) return c.json({ msg: "User does not exist!" });

    if (already.password !== body.password)
      return c.json({ msg: "Invalid password." });

    const token = await sign({ id: already.id }, c.env.JWT_SECRET);

    return c.json({ msg: "User created!", token });
  } catch (err) {
    return c.json({ msg: "Please send valid body.", err });
  }
});

export default userRouter;
