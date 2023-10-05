import React, { useState } from 'react';
import SearchIcon from 'src/components/Icons/searchIcon';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice';
import { fetchSearchResults } from 'src/hooks/useSearch';

const SearchForm: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const dispatch = useDispatch();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value.trim()); // Trim the input value
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!searchQuery) {  // Validate the searchQuery
            console.error("Search query is empty.");
            return;
        }

        try {
            const results = await fetchSearchResults(searchQuery);
            dispatch(setSearchResults(results));
            router.push(`/search/${searchQuery}`); // Removed await since we're not using shallow routing
        } catch (error) {
            console.error("Error fetching search results:", error.message);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="lg:pl-2 w-full">
                <label htmlFor="topbar-search" className="sr-only">Search</label>
                <div className="relative md:w-64 lg:w-96 w-full">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="topbar-search"
                        value={searchQuery}
                        onChange={handleInputChange}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        placeholder="Search for free clip art"
                    />
                </div>
            </form>
        </div>
    );
}

export default SearchForm;
