import React, { useState } from 'react';
import SearchIcon from 'src/components/Icons/searchIcon';
import { useRouter } from 'next/router'; // Import the useRouter hook

const SearchForm: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter(); // Initialize the useRouter hook

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.push(`/search/${searchQuery}`); // Update the URL to reflect the search query
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
                        name="search" // Updated the name attribute
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
