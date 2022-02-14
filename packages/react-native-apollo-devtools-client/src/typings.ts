import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

export type ApolloClientType = ApolloClient<NormalizedCacheObject>;

export interface Query {
  id: number;
  name: string | null;
  variables: Record<string, any> | undefined;
}

export type QueryData = Query & {
  queryString: string;
  cachedData: object;
};

export type MutationData = {
  id: string;
  name: string | null;
  variables: object;
  loading: boolean;
  error: object;
  body: string | undefined;
};

export type Callback = () => any;

export type ArrayOfQuery = Array<QueryData | undefined>;
export type ArrayOfMutations = Array<MutationData>;

export type ApolloClientState = {
  id: number;
  lastUpdateAt: string;
  queries: ArrayOfQuery;
  mutations: ArrayOfMutations;
  cache: object;
};
