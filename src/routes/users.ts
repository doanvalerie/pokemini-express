import express from "express";

import { getUser, capturePokemon } from "../controllers/users.ts";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const payload = await getUser(req.params.userId);
    // payload is newline-separated
    res.send(payload);
  } catch (error) {
    res.status(400).send({ error });
  }
});

router.post("/:userId/pokemon/:pokemonId", async (req, res) => {
  try {
    const payload = await capturePokemon(
      req.params.userId,
      req.params.pokemonId,
    );
    // payload is empty, so nothing returned
    res.send(payload);
  } catch (error) {
    res.status(400).send({ error });
  }
});

export default router;
