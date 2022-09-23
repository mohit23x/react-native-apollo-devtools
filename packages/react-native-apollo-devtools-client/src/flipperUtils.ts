/* eslint-disable consistent-return */
import { ObservableQuery } from '@apollo/client';
import type { QueryInfo } from '@apollo/client/core/QueryInfo';
import { getOperationName } from '@apollo/client/utilities';
import { ASTNode, print } from 'graphql';
import type {
  ArrayOfQuery,
  QueryData,
  RawQueryData,
  Variables,
} from './typings';

let done = true;

// export function getQueryData(
//   query: QueryInfo,
//   key: number,
// ): QueryData | undefined {
//   console.log({query, key});
//   if (!query || !query.document) return;
//   // TODO: The current designs do not account for non-cached data.
//   // We need a workaround to show that data + we should surface
//   // the FetchPolicy.
//   const name = getOperationName(query?.document);
//   if (name === 'IntrospectionQuery') {
//     return;
//   }

//   if (done) {
//     done = false;
//     return;
//   }

//   return {
//     id: key,
//     name,
//     queryString: print(query.document),
//     variables: query.variables,
//     // @ts-expect-error
//     cachedData: query.cachedData,
//   };
// }

export function getQueries(queryMap: Map<string, RawQueryData>): ArrayOfQuery {
  let queries: ArrayOfQuery = [];

  // console.log(queryMap);
  // console.log('query map: ', JSON.stringify([...queryMap.values()][0]?.cache));

  // queryMap.forEach((val, key) => {
  //   // const obj = val[key]
  //   // console.log({key});
  // console.log(val);
  // console.log('cache data: ', JSON.stringify(val?.lastDiff?.diff?.result));
  //   // console.log('cache config: ', val?.cache?.data);

  //   // console.log('optimistic data: ', val?.lastDiff?.diff?.result);
  //   // console.log('optimistic data: ', val?.lastDiff?.diff?.missing);
  // });

  if (queryMap) {
    [...queryMap.values()].forEach(
      ({ document, variables, observableQuery, lastDiff, queryId, diff }) => {
        // console.log("lastDiff: ", lastDiff);
        console.log('diff: ', diff);
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
