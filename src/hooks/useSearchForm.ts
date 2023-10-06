// hooks/useSearchForm.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice';
import { fetchSearchResults } from 'src/hooks/useSearch';

export const useSearchForm = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value); 
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) {
            console.error("Search query is empty.");
            return;
        }

        try {
            const results = await fetchSearchResults(trimmedQuery);
            dispatch(setSearchResults(results));
            router.push(`/search/${trimmedQuery}`);
        } catch (error) {
            console.error("Error fetching search results:", error.message);
        }
    };

    return {
        searchQuery,
        handleInputChange,
        handleSubmit
    };
}
