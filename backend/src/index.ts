import { Hono } from "hono";
import { decode, verify, sign } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import userRouter from "./routes/user";
import blogRouter from "./routes/blog";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
  Variables: {
    userId: string;
  };
}>();
const apiV1BaseUrl = "/api/v1";

app.route(`${apiV1BaseUrl}/user`, userRouter);
app.route(`${apiV1BaseUrl}/blogs`, blogRouter);

export default app;
