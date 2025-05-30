import express from "express";

import { deletePokemon, getNearestPokemon } from "../controllers/pokemon.ts";

const router = express.Router();

interface PokemonNearbyQuery {
  latitude: string;
  longitude: string;
}

router.delete("/:id", async (req, res) => {
  try {
    const payload = await deletePokemon(req.params.id);
    // Payload is empty, so nothing returned
    res.send(payload);
  } catch (error) {
    res.status(400).send({ error });
  }
});

router.get(
  "/nearby",
  async (req: express.Request<{}, any, {}, PokemonNearbyQuery>, res) => {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);

    try {
      const payload = await getNearestPokemon(latitude, longitude);
      // Payload is newline-separated
      res.send(payload);
    } catch (error) {
      res.status(400).send({ error });
    }
  },
);

export default router;
