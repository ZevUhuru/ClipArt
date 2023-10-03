import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  results: [],
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
  },
});

export const { setSearchResults, setSearchLoading, setSearchError } = searchSlice.actions;
export default searchSlice.reducer;
