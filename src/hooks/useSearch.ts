import { useQuery } from 'react-query';
import axios from 'axios';

export const fetchSearchResults = async (query) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/search`, { params: { q: query } });
  return response.data.data;  // Assuming the results are inside a "data" property in the response.
};


export const useSearch = (query) => {
  return useQuery(['search', query], () => fetchSearchResults(query));
};
