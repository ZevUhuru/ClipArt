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
    searchStarted: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    searchSuccess: (state, action) => {
      state.results = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    searchFailed: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const { searchStarted, searchSuccess, searchFailed } = searchSlice.actions;
export default searchSlice.reducer;
