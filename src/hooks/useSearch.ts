// hooks/useSearch.ts
import { useRouter } from 'next/router';

const useSearch = (): (query: string) => Promise<void> => {
  const router = useRouter();

  const handleSearchResults = async (query: string): Promise<void> => {
    try {
      const response = await fetch(`/api/search?q=${query}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const results: any = await response.json(); // You can replace 'any' with the expected shape of your results if known
      // ... any other logic you want to apply
      router.push(`/search/${query}`);
    } catch (error) {
      console.error("Error fetching search results:", error);
      // Handle the error appropriately, maybe show a user-friendly message
    }
  };

  return handleSearchResults;
};

export default useSearch;
