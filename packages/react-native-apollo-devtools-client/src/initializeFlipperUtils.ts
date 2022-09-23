/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-statements-per-line */
/* eslint-disable babel/no-invalid-this */
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
  const queryMap = extractQueries(client);
  const allQueries = getQueries(queryMap);
  return allQueries;
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

    console.log({ loading, error, body: mutation?.loc?.source?.body });

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

function getCurrentState(client: ApolloClientType): Promise<ApolloClientState> {
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
    console.log({ currentState: currentState?.queries[0] });

    return currentState;
  });
}

function debounce(func: (...args: any) => any, timeout = 500): () => any {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    // @ts-expect-error missing type for "this"
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

export const initializeFlipperUtils = async (
  flipperConnection: Flipper.FlipperConnection,
  apolloClient: ApolloClientType
): Promise<void> => {
  let acknowledged = true;
  let enqueue: null | ApolloClientState = await getCurrentState(apolloClient);

  console.log({ acknowledged });

  function sendData(): void {
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
    if (acknowledged) {
      enqueue = await getCurrentState(apolloClient);
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

  apolloClient.__actionHookForDevTools(debounce(() => logger()));

  flipperConnection.send('GQL:response', enqueue);
};
