/**
 * Sources used to build an Express application with Typescript and DynamoDB
 * 1. https://dev.to/wizdomtek/typescript-express-building-robust-apis-with-nodejs-1fln
 * 2. https://blog.logrocket.com/express-typescript-node/
 * 3. https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/
 * 4. https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/programming-with-javascript.html
 * 5. https://expressjs.com/en/guide/routing.html
 * 6. https://faerulsalamun.medium.com/restful-api-with-node-js-express-and-dynamodb-5059beb3ba7f
 * 7. https://tapiwanashekanda.hashnode.dev/how-to-create-a-crud-api-using-expressjs-and-aws-dynamodb
 */

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

const server = app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

server.keepAliveTimeout = 60 * 1000 * 10; // timeout is 10 minutes