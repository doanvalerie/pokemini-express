import express from "express";

import { deletePokemon, getNearestPokemon } from "../controllers/pokemon.ts";

const router = express.Router();

interface PokemonNearbyQuery {
  latitude: string;
  longitude: string;
}

router.delete("/:id", async (req, res) => {
  const payload = await deletePokemon(req.params.id);
  res.send(payload);
});

router.get(
  "/nearby",
  async (req: express.Request<{}, {}, {}, PokemonNearbyQuery>, res) => {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);

    const payload = await getNearestPokemon(latitude, longitude);
    console.log(payload);
    res.send(payload);
  },
);

export default router;
