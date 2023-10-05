import { createSelector } from 'reselect';

export const getSearchResults = (state) => state.search?.results;
export const getDefaultResults = (state) => state.search?.defaultResults;



export const getSortedSearchResults = createSelector(
  [getSearchResults],
  (results) => {
    // Your sorting logic here, if needed
    return results;
  }
);
