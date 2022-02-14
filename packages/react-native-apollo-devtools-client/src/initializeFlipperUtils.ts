/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DocumentNode } from '@apollo/client';
import { getOperationName } from '@apollo/client/utilities';
import type { Flipper } from 'react-native-flipper';
import { getQueries, getQueryData } from './flipperUtils';
import type {
  ApolloClientState,
  ApolloClientType,
  ArrayOfMutations,
  ArrayOfQuery,
  MutationData,
} from './typings';

let counter = 0;

function getTime(): string {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}`;
}

function extractQueries(client: ApolloClientType): Map<any, any> {
  // @ts-expect-error queryManager is private method
  if (!client || !client.queryManager) {
    return new Map();
  }
  // @ts-expect-error queryManager is private method
  return client.queryManager.queries;
}

function getAllQueries(client: ApolloClientType): ArrayOfQuery {
  // console.log("==========")
  // console.log("queries: ", client.queryManager.queries);
  // console.log("==========")

  const queryMap = extractQueries(client);

  const allQueries = getQueries(queryMap);

  return allQueries?.map(getQueryData);
}

type MutationObject = {
  mutation: DocumentNode;
  variables: object;
  loading: boolean;
  error: object;
};
function getMutationData(
  allMutations: Record<string, MutationObject>
): Array<MutationData> {
  return [...Object.keys(allMutations)]?.map((key) => {
    const { mutation, variables, loading, error } = allMutations[key];

    // console.log({ key });
    // console.log(JSON.stringify(allMutations[key]));
    return {
      id: key,
      name: getOperationName(mutation),
      variables,
      loading,
      error,
      body: mutation?.loc?.source?.body,
    };
  });
}

function getAllMutations(client: ApolloClientType): ArrayOfMutations {
  // @ts-expect-error private method
  const allMutations = client.queryManager.mutationStore || {};

  const final = getMutationData(allMutations);

  return final;
}

function getCurrentState(client: ApolloClientType): ApolloClientState {
  counter++;
  return {
    id: counter,
    lastUpdateAt: getTime(),
    queries: getAllQueries(client),
    mutations: getAllMutations(client),
    cache: client.cache.extract(true),
  };
}

export const initializeFlipperUtils = (
  flipperConnection: Flipper.FlipperConnection,
  apolloClient: ApolloClientType
): void => {
  let acknowledged = true;
  let enqueue: null | ApolloClientState = getCurrentState(apolloClient);

  function sendData() {
    if (enqueue) {
      flipperConnection.send('GQL:response', enqueue);
      acknowledged = false;
      enqueue = null;
    }
  }

  const logger = (): void => {
    enqueue = getCurrentState(apolloClient);
    if (acknowledged) {
      sendData();
    }
  };

  flipperConnection.receive('GQL:ack', () => {
    acknowledged = true;
    sendData();
  });

  flipperConnection.receive('GQL:request', () => {
    flipperConnection.send('GQL:response', getCurrentState(apolloClient));
  });

  flipperConnection.send('GQL:response', enqueue);

  apolloClient.__actionHookForDevTools(logger);
};
