import React, { useEffect } from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Sidebar from 'src/components/Page/Search/sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice';
import { getSearchResults } from 'src/selectors/searchSelectors';
import { fetchSearchResults } from 'src/hooks/useSearch';

const SearchPage = ({ initialSearchResults, currentQuery }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        async function fetchAndSetSearchResults() {
            const searchResults = await fetchSearchResults(currentQuery);
            dispatch(setSearchResults(searchResults));
        }

        if (initialSearchResults) {
            dispatch(setSearchResults(initialSearchResults));
        } else {
            fetchAndSetSearchResults();
        }
    }, [currentQuery, dispatch, initialSearchResults]);

    const reduxSearchResults = useSelector(getSearchResults);

    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
                <SearchHeader />
                <Gallery searchResults={reduxSearchResults} />
            </div>
        </>
    );
};

export async function getServerSideProps(context) {
    try {
        const query = context.query.q;

        let searchResults = await fetchSearchResults(query);

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
