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
const POKEMON_RADIUS = metersToDegrees(100); // Generate monsters within 50 meter radius.
const ACTIVATE_RAD_WITH_MARGIN = ACTIVATE_RADIUS * 3;

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
  const randRadius =
    ACTIVATE_RAD_WITH_MARGIN +
    Math.random() * (POKEMON_RADIUS - ACTIVATE_RAD_WITH_MARGIN);
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

interface NearestPokemonWithDist {
  dist: number;
  pokemon: any;
};

interface NearestPokemonReturn {
  shouldActivate: boolean;
  pokemon: any;
}

const formatGetNearestPokemon = (nearData: any) => {
  let output = '';
  output += nearData.shouldActivate.toString() + '\n';
  output += nearData.pokemon.id + '\n';
  output += nearData.pokemon.type + '\n';
  output += nearData.pokemon.location.latitude + '\n';
  output += nearData.pokemon.location.longitude + '\n';
  return output;
}

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
  let activatablePokemonToDelete: NearestPokemonWithDist[] = [];
  let nearestPokemonWithDist: NearestPokemonWithDist | null = null;

  for (const pokemon of allPokemon) {
    const pLatitude = pokemon.location.latitude;
    const pLongitude = pokemon.location.longitude;

    const diff_x = Math.abs(pLatitude - latitude);
    const diff_y = Math.abs(pLongitude - longitude);
    const dist = Math.sqrt(Math.pow(diff_x, 2) + Math.pow(diff_y, 2));

    const newPokemonWithDist = {
      dist,
      pokemon
    };

    if (!nearestPokemonWithDist || dist < nearestPokemonWithDist.dist) {
      nearestPokemonWithDist = newPokemonWithDist;

      if (dist < ACTIVATE_RAD_WITH_MARGIN) {
        activatablePokemonToDelete.push(nearestPokemonWithDist);
      }
    }

    activatablePokemonToDelete = activatablePokemonToDelete.filter(activatablePokemon => {
      if (nearestPokemonWithDist && nearestPokemonWithDist.pokemon.id == activatablePokemon.pokemon.id) {
        return false;
      } else {
        return true;
      }
    });
  }

  try {
    await Promise.all(
      activatablePokemonToDelete.map((activatablePokemon) => deletePokemon(activatablePokemon.pokemon.id)),
    );
    let returnPokemon: NearestPokemonReturn | null = null;

    if (nearestPokemonWithDist) {
      returnPokemon = {
        shouldActivate: nearestPokemonWithDist.dist < ACTIVATE_RADIUS,
        pokemon: nearestPokemonWithDist.pokemon
      };
    }

    if (returnPokemon) {
      return formatGetNearestPokemon(returnPokemon);
    } else {
      return returnPokemon;
    }
  } catch (error) {
    throw new Error("Failure: get nearest pokemon");
  }
};
