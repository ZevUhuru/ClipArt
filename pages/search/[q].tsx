import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Footer from 'src/components/footer';
import { useSearch } from 'src/hooks/useSearch';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice'; // Make sure to import the action
import { getSearchResults } from 'src/selectors/searchSelectors';
import { imagesArray } from 'src/constants';
import _ from 'lodash';



const SearchPage = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    const [currentQuery, setCurrentQuery] = useState<string | undefined>(router.query.q as string);



    // Use react-query to fetch search results
    const { data: searchResults, isLoading, error } = useSearch(currentQuery);

    useEffect(() => {
        setCurrentQuery(router.query.q as string);
    }, [router.query.q]);

    useEffect(() => {
        if (searchResults) {
            dispatch(setSearchResults(searchResults));
        }
    }, [searchResults, dispatch]);

    // Get the search results from Redux using reselect
    const reduxSearchResults = useSelector(getSearchResults);

    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900">
                <SearchHeader  />
                <Gallery searchResults={reduxSearchResults} hasSearched={!!currentQuery} defaultImages={imagesArray} />
                <Footer />
            </div>
        </>
    );
};

export default SearchPage;
