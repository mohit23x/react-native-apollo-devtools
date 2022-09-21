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
    console.log('client?.queryManager not present');
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

  // console.log({queryMap: JSON.stringify(queryMap)});

  const allQueries = getQueries(queryMap);

  return allQueries;
  // return allQueries?.map(getQueryData);
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

async function getCurrentState(
  client: ApolloClientType
): Promise<ApolloClientState> {
  counter++;

  let currentState: ApolloClientState;

  return new Promise((res, rej) => {
    setTimeout(() => {
      currentState = {
        id: counter,
        lastUpdateAt: getTime(),
        queries: getAllQueries(client),
        mutations: getAllMutations(client),
        cache: client.cache.extract(true),
      };
      res(currentState);
    }, 0);
  }).then(() => {
    console.log({ currentState: JSON.stringify(currentState) });

    return currentState;
  });
}

export const initializeFlipperUtils = async (
  flipperConnection: Flipper.FlipperConnection,
  apolloClient: ApolloClientType
): Promise<void> => {
  let acknowledged = true;
  let enqueue: null | ApolloClientState = await getCurrentState(apolloClient);

  console.log({ acknowledged });

  function sendData() {
    console.log({ enqueue });
    if (enqueue) {
      console.log('sending data');
      flipperConnection.send('GQL:response', enqueue);
      acknowledged = false;
      enqueue = null;
    }
  }

  const logger = async (): Promise<void> => {
    console.log('** logger **');
    enqueue = await getCurrentState(apolloClient);
    if (acknowledged) {
      sendData();
    }
  };

  flipperConnection.receive('GQL:ack', () => {
    acknowledged = true;
    console.log('GQL:ack ', acknowledged);
    sendData();
  });

  flipperConnection.receive('GQL:request', async () => {
    console.log('request form flipper');
    flipperConnection.send('GQL:response', await getCurrentState(apolloClient));
  });

  apolloClient.__actionHookForDevTools(logger);

  flipperConnection.send('GQL:response', enqueue);
};
