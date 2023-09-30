import React, { useState } from 'react';
import SearchIcon from 'src/components/Icons/searchIcon';
import typesenseClient from 'src/utils/typesense';
import _ from 'lodash';

const SearchForm = ({ onSearchResults }) => {
    const [query, setQuery] = useState('');

    const search = async () => {
        const searchParameters = {
            q: query,
            query_by: 'title,tags,description',
            prefix: true,
            num_typos: 2,
            per_page: 30,
        };

        try {
            const searchResults = await typesenseClient.collections('clip_arts').documents().search(searchParameters);
            onSearchResults(searchResults.hits);
            console.log(searchResults.hits);
        } catch (error) {
            console.error("Error during search:", error);
        }
    };

    // Debounce the search function
    const debouncedSearch = _.debounce(search, 300);

    const handleSearch = (e) => {
        e.preventDefault();
        debouncedSearch();
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="hidden md:block lg:pl-2">
                <label htmlFor="topbar-search" className="sr-only">Search</label>
                <div className="relative md:w-64 lg:w-96">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        name="email"
                        id="topbar-search"
                        value={query}
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
