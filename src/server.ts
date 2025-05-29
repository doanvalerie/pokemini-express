import dotenv from "dotenv";
import express from "express";

import indexRouter from "./routes/index.ts";
import usersRouter from "./routes/users.ts";
import pokemonRouter from "./routes/pokemon.ts";

dotenv.config();
const app = express();

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/pokemon", pokemonRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
