// store.js
import { configureStore } from '@reduxjs/toolkit';
import searchResultsReducer from './slices/searchResultsSlice';

const store = configureStore({
  reducer: {
    searchResults: searchResultsReducer,
  },
});

export default store;
