import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import docClient from "../config/aws.ts";

// https://stackoverflow.com/questions/25237356/convert-meters-to-decimal-degrees
const metersToDegrees = (meters: number) => meters / 111320;

const POKEMON_TYPES = ["pikachu", "jigglypuff", "piplup", "eevee", "lickitung"];
const MINIMUM_NEARBY_POKEMON = 6;
const ACTIVATE_RADIUS = metersToDegrees(10); // Proximity to pokemon in which launchpad will trigger fight or flee page
const POKEMON_RADIUS = metersToDegrees(50); // Generate monsters within 50 meter radius.

export const getPokemon = async (pokemonId: string) => {
  const params = {
    TableName: process.env.POKEMON_TABLE_NAME,
    Key: {
      id: pokemonId,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data.Item!;
  } catch (error) {
    throw new Error("Failure: get pokemon by ID");
  }
};

export const scanPokemon = async () => {
  const params = {
    TableName: process.env.POKEMON_TABLE_NAME,
  };

  try {
    const pokemon = await docClient.send(new ScanCommand(params));
    if (!pokemon.Items) {
      return [];
    } else {
      return pokemon.Items;
    }
  } catch (error) {
    throw new Error("Failure: get all pokemon");
  }
};

export const deletePokemon = async (pokemonId: string) => {
  const params = {
    TableName: process.env.POKEMON_TABLE_NAME,
    Key: {
      id: pokemonId,
    },
  };

  try {
    await docClient.send(new DeleteCommand(params));
  } catch (error) {
    throw new Error("Failure: delete pokemon by ID");
  }
};

const addPokemon = async (latitude: number, longitude: number) => {
  // 1.5 multipler to activation radius to prevent pokemon from spawning right at activation boundary
  const marginActivationRadius = ACTIVATE_RADIUS * 1.5;
  const randRadius =
    marginActivationRadius +
    Math.random() * (POKEMON_RADIUS - marginActivationRadius);
  const randAngle = Math.random() * 2 * Math.PI;

  const xOffset = randRadius * Math.cos(randAngle);
  const yOffset = randRadius * Math.sin(randAngle);

  const newX = latitude + xOffset;
  const newY = longitude + yOffset;

  const randomTypeIdx = Math.floor(Math.random() * POKEMON_TYPES.length);
  const randomType = POKEMON_TYPES[randomTypeIdx];

  const params = {
    TableName: process.env.POKEMON_TABLE_NAME,
    Item: {
      id: crypto.randomUUID().toString(),
      type: randomType,
      location: {
        latitude: newX,
        longitude: newY,
      },
    },
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    return data;
  } catch (error) {
    throw new Error("Failure: add pokemon");
  }
};

const addNearbyPokemon = async (latitude: number, longitude: number) => {
  const allPokemon = await scanPokemon();
  let numNearbyPokemon = 0;

  for (const pokemon of allPokemon) {
    const pLatitude = pokemon.location.latitude;
    const pLongitude = pokemon.location.longitude;

    const diff_x = Math.abs(pLatitude - latitude);
    const diff_y = Math.abs(pLongitude - longitude);
    const dist = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2));
    if (dist < POKEMON_RADIUS) {
      numNearbyPokemon += 1;
    }
  }

  while (numNearbyPokemon < MINIMUM_NEARBY_POKEMON) {
    await addPokemon(latitude, longitude);
    numNearbyPokemon += 1;
  }
};

export const getNearestPokemon = async (
  latitude: number,
  longitude: number,
) => {
  /*
   * If there is at least one pokemon within activation_radius, then check if there
   * are multiple pokemon within 1.5*activation_radius. If so, then remove the duplicates
   * from the larger radius and only return the single pokemon from within the smaller radius.
   */
  await addNearbyPokemon(latitude, longitude);

  const allPokemon = await scanPokemon();
  let nearestPokemon = [];

  for (const pokemon of allPokemon) {
    const pLatitude = pokemon.location.latitude;
    const pLongitude = pokemon.location.longitude;

    const diff_x = Math.abs(pLatitude - latitude);
    const diff_y = Math.abs(pLongitude - longitude);
    const dist = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2));

    if (dist < ACTIVATE_RADIUS) {
      nearestPokemon.push(pokemon);
    }
  }

  try {
    await Promise.all(
      nearestPokemon.slice(1).map((pokemon) => deletePokemon(pokemon.id)),
    );
    return nearestPokemon[0];
  } catch (error) {
    throw new Error("Failure: get nearest pokemon");
  }
};
