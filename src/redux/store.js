// store.js
import { configureStore } from '@reduxjs/toolkit';
import searchResultsReducer from './features/search/searchSlice';



const store = configureStore({
  reducer: {
    searchResults: searchResultsReducer,
  },
});

export default store;
