import { initializeApp } from "./app";
import { log } from "./vite";

(async () => {
  const { app, server } = await initializeApp();

  if (!server) {
    throw new Error("Failed to create HTTP server");
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
