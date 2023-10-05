import { createSlice } from '@reduxjs/toolkit';
import { imagesArray } from 'src/constants';

const initialState = {
  results: [],
  defaultResults: [...imagesArray],
  isLoading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchResults: (state, action) => {
      state.results = action.payload;
    },
    setSearchLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSearchError: (state, action) => {
      state.error = action.payload;
    },
    // setDefaultResults: (state, action) => {
    //   state.defaultResults = action.payload;
    // },
  },
});

export const { setSearchResults, setSearchLoading, setSearchError } = searchSlice.actions;
export default searchSlice.reducer;
