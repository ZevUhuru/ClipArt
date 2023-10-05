import { createSelector } from 'reselect';

export const getSearchResults = (state) => state.searchResults?.results;
export const getDefaultResults = (state) => state.searchResults?.defaultResults;



export const getSortedSearchResults = createSelector(
  [getSearchResults],
  (results) => {
    // Your sorting logic here, if needed
    return results;
  }
);
