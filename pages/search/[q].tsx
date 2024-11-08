import React, { useEffect, useState, useCallback } from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults } from 'src/redux/features/search/searchSlice';
import { getSearchResults } from 'src/selectors/searchSelectors';
import { fetchSearchResults } from 'src/hooks/useSearch';
import debounce from 'lodash/debounce';  // Use lodash's debounce instead

interface SearchResult {
    id: string;
    title: string;
    // Add other properties based on your actual search results
}

interface SearchPageProps {
    initialSearchResults: SearchResult[];
    currentQuery: string;
    error: string | null;  // String for meaningful error messages
}

const SearchPage: React.FC<SearchPageProps> = ({ initialSearchResults, currentQuery, error: serverError }) => {
    const dispatch = useDispatch();
    const [error, setError] = useState<string | null>(serverError || null);
    const [isLoading, setIsLoading] = useState(false);
    const reduxSearchResults = useSelector(getSearchResults);

     // Create a debounced version of the search function
     const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            setIsLoading(true);
            setError(null);
            
            try {
                const searchResults = await fetchSearchResults(query);
                dispatch(setSearchResults(searchResults));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [dispatch]
    );

    useEffect(() => {
        if (initialSearchResults) {
            dispatch(setSearchResults(initialSearchResults));
        } else if (currentQuery) {
            debouncedSearch(currentQuery);
        }

        // Cleanup
        return () => {
            debouncedSearch.cancel();
        };
    }, [currentQuery, dispatch, initialSearchResults, debouncedSearch]);

    return (
        <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
            <SearchHeader />
            <Gallery 
                searchResults={reduxSearchResults}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
};

export async function getServerSideProps(context) {
    try {
        const query = context.query.q;

        // Query validation
        if (!query || typeof query !== 'string') {
            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                }
            };
        }

        // Validate query length
        if (query.trim().length < 2) {
            return {
                props: {
                    initialSearchResults: [],
                    currentQuery: query,
                    error: 'Search query must be at least 2 characters long'
                }
            };
        }

        const searchResults = await fetchSearchResults(query);

        return {
            props: {
                initialSearchResults: searchResults,
                currentQuery: query
            }
        };
    } catch (error) {
        console.error("Error in getServerSideProps:", error);
        return {
            props: {
                initialSearchResults: [],
                currentQuery: context.query.q || '',
                error: 'Failed to fetch search results'
            }
        };
    }
}

export default SearchPage;