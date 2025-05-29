import express from "express";

import { getUser, capturePokemon } from "../controllers/users.ts";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  const payload = await getUser(req.params.userId);
  res.send(payload);
});

router.post("/:userId/pokemon/:pokemonId", async (req, res) => {
  const payload = await capturePokemon(req.params.userId, req.params.pokemonId);
  res.send(payload);
});

export default router;
