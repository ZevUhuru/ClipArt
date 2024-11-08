import React from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import { useSelector } from 'react-redux';
import { getDefaultResults, getSearchResults } from 'src/selectors/searchSelectors';

const SearchIndexPage = ({ isLoading, error}) => {
  const defaultResults = useSelector(getDefaultResults)

  return (
    <>
      <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
        <SearchHeader />
        <Gallery isLoading={false} error={null} searchResults={defaultResults} />
      </div>
    </>
  );
};

export default SearchIndexPage;
