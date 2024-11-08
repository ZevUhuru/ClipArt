import { useQuery } from 'react-query';
import axios from 'axios';

interface SearchResult {
  id: string;
  title: string;
}

export const fetchSearchResults = async (query) => {
  try {
    const response = await axios.get<{ data: SearchResult[] }>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/search`, 
      { params: { q: query } }
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log the full error for debugging
      console.error('Search API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Search request timed out. Please try again.');
      }
      if (!error.response) {
        throw new Error('Network error: Please check your connection');
      }
      if (error.response.status === 404) {
        throw new Error('Search API endpoint not found');
      }
      throw new Error(
        error.response?.data?.message || 
        `Search failed: ${error.response?.statusText || 'Unknown error'}`
      );
    }
    // For non-Axios errors
    console.error('Unexpected search error:', error);
    throw new Error('An unexpected error occurred while searching');
  }
};


export const useSearch = (query) => {
  return useQuery(['search', query], () => fetchSearchResults(query));
};
