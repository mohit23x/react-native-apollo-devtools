import { print } from 'graphql';
import type { ArrayOfQuery, RawQueryData } from './typings';

export function getQueries(queryMap: Map<string, RawQueryData>): ArrayOfQuery {
  let queries: ArrayOfQuery = [];

  if (queryMap) {
    [...queryMap.values()].forEach(
      ({ document, variables, observableQuery, lastDiff, queryId }) => {
        if (document && observableQuery) {
          queries.push({
            queryString: print(document),
            variables,
            cachedData: lastDiff?.diff?.result,
            name: observableQuery?.queryName,
            id: queryId,
          });
        }
      }
    );
  }
  return queries;
}
