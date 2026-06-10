import { createApp } from "./app";
import { env } from "./config/env";

// Server bootstrap.
const app = createApp();

app.listen(env.port, () => {
  console.log(
    `[backend] Wayco recruiter API listening on http://localhost:${env.port} (${env.nodeEnv})`
  );
});
