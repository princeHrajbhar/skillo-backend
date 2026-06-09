import { app } from './app.js'; // Note: Always include the .js extension for ESM

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});