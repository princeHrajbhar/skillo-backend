import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const PORT = ENV.PORT || 5000;

await connectDB();

app.listen(PORT, () => {
  console.log("🚀 Server running at http://localhost:" + PORT);
});