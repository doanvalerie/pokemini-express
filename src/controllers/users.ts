import express from "express";

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
    console.log("Result: " + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error:", error);
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
    console.log("Result : " + JSON.stringify(data));
    return data;
  } catch (error) {
    throw new Error("Unable to DB Get User");
  }
};

export const getUser = async (userId: string) => {
  const user = await dbGetUser(userId);

  if (user.Item) {
    return user.Item;
  }

  await createUser(userId);
  return (await dbGetUser(userId)).Item!;
};

export const capturePokemon = async (userId: string, pokemonId: string) => {
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

  await docClient.send(new UpdateCommand(params));
  await deletePokemon(pokemonId);
};
