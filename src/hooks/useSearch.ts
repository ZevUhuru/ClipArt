import { useQuery } from 'react-query';
import axios from 'axios';

export const fetchSearchResults = (query) => {
  return axios.get('/api/search', { params: { q: query } }).then((res) => res.data);
};

export const useSearch = (query) => {
  return useQuery(['search', query], () => fetchSearchResults(query));
};
