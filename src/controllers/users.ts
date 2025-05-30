import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { deletePokemon, getPokemon } from "./pokemon.ts";

import docClient from "../config/aws.ts";

const createUser = async (userId: string) => {
  const params = {
    TableName: process.env.USER_TABLE_NAME,
    Item: {
      id: userId,
      pokemonCollection: [],
    },
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    return data;
  } catch (error) {
    throw new Error("Unable to Create User");
  }
};

const dbGetUser = async (userId: string) => {
  const params = {
    TableName: process.env.USER_TABLE_NAME,
    Key: {
      id: userId,
    },
  };

  try {
    const data = await docClient.send(new GetCommand(params));
    return data;
  } catch (error) {
    throw new Error("Unable to DB Get User");
  }
};

const getUserFormat = (userData: any) => {
  let output = '';
  output += userData.id.toString() + '\n'
  for (const pokemon of userData.pokemonCollection) {
    output += pokemon.id + '\n';
    output += pokemon.type + '\n';
  }

  return output;
}

export const getUser = async (userId: string) => {
  try {
    const user = await dbGetUser(userId);
    if (user.Item) {
      return getUserFormat(user.Item);
    }
    await createUser(userId);
    return getUserFormat((await dbGetUser(userId)).Item!);
  } catch (error) {
    throw new Error("Failure: GET user");
  }
};

export const capturePokemon = async (userId: string, pokemonId: string) => {
  try {
    const pokemonData = await getPokemon(pokemonId);
    const params = {
      TableName: process.env.USER_TABLE_NAME,
      Key: { id: userId },
      UpdateExpression:
        "SET pokemonCollection = list_append(pokemonCollection, :item)",
      ExpressionAttributeValues: {
        ":item": [{ id: pokemonData.id, type: pokemonData.type }],
      },
    };

    await deletePokemon(pokemonId);
    await docClient.send(new UpdateCommand(params));
  } catch (error) {
    throw new Error("Failure: POST Capture Pokemon");
  }
};
