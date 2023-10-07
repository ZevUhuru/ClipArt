import React from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Footer from 'src/components/footer';
import { useSelector } from 'react-redux';
import { getDefaultResults, getSearchResults } from 'src/selectors/searchSelectors';
import { imagesArray } from 'src/constants';

const SearchIndexPage = () => {
  const defaultResults = useSelector(getDefaultResults)

  return (
    <>
      <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
        <SearchHeader />
        <Gallery searchResults={defaultResults} />
      </div>
    </>
  );
};

export default SearchIndexPage;
