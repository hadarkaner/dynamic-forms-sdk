import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const server = app.listen(env.port, () => {
  console.log(`Dynamic Forms SDK API listening on port ${env.port} [${env.nodeEnv}]`);
});

const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
