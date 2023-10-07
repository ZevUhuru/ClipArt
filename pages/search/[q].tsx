import React, { useEffect } from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Sidebar from 'src/components/Page/Search/sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice'; // Make sure to import the action
import { getSearchResults } from 'src/selectors/searchSelectors';
import { fetchSearchResults } from 'src/hooks/useSearch'; // Assuming this function makes the API request

const SearchPage = ({ initialSearchResults, currentQuery }) => {
    const dispatch = useDispatch();

    // Set initial search results to Redux store
    useEffect(() => {
        if (initialSearchResults) {
            console.log('initialSearchResults', initialSearchResults)
            dispatch(setSearchResults(initialSearchResults));
        }
    }, []);
    

    // Get the search results from Redux using reselect
    const reduxSearchResults = useSelector(getSearchResults);

    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
                <SearchHeader  />
                <Gallery searchResults={reduxSearchResults} />
            </div>
        </>
    );
};

export async function getServerSideProps(context) {
    try {
        console.log("getServerSideProps triggered");
        const query = context.query.q;
        console.log("Query parameter:", query);

        let searchResults = await fetchSearchResults(query);
        console.log('Server fetched results:', searchResults);

        return {
            props: {
                initialSearchResults: searchResults,
                currentQuery: query
            }
        };
    } catch (error) {
        console.error("Error in getServerSideProps:", error.message);
        return {
            props: {
                initialSearchResults: [],
                currentQuery: ''
            }
        };
    }
}


export default SearchPage;
