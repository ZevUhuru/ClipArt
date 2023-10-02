// pages/search/[q].js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Footer from 'src/components/footer';
import { imagesArray } from 'src/constants';
import _ from 'lodash'

const SearchPage = ({ searchResults: initialSearchResults }) => {
    const [searchResults, setSearchResults] = useState(initialSearchResults);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter(); // Corrected from the provided code

    const search = async (query) => {
        try {
            const response = await fetch(`/api/search?q=${query}`);
            const results = await response.json();
            handleSearchResults(results, query);
            console.log(results);
        } catch (error) {
            console.error("Error during search:", error);
        }
    };

    // Debounce the search function
    const debouncedSearch = _.debounce(search, 300);

    const handleSearch = (query) => {
        debouncedSearch(query);
    };

    const handleSearchResults = (results, query) => {
        try {
            setSearchResults(results);
            setHasSearched(true);
        } catch (error) {
            console.error("Error updating search results:", error);
            // Handle the error appropriately, maybe show a user-friendly message
        }
        // Navigate to the new search page based on the passed query
        router.push(`/search/${query}`);
    };

    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900">
                <SearchHeader handleSearch={handleSearch} />
                <Gallery searchResults={searchResults} hasSearched={hasSearched} defaultImages={initialSearchResults} />
                <Footer />
            </div>
        </>
    );
};


export const getServerSideProps = async (context) => {
    const { query } = context.query;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}/api/search?q=${query}`);
    const searchResults = await response.json();

    return {
        props: {
            searchResults,
        },
    };
};

export default SearchPage;
