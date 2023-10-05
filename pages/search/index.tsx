import React from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Gallery from 'src/components/Page/Search/gallery';
import Footer from 'src/components/footer';
import { useSelector } from 'react-redux';
import { getSearchResults } from 'src/selectors/searchSelectors';
import { imagesArray } from 'src/constants';

const SearchIndexPage = () => {
  const reduxSearchResults = useSelector(getSearchResults);
  const hasSearched = reduxSearchResults?.length > 0;

  return (
    <>
      <div className="antialiased bg-gray-50 dark:bg-gray-900">
        <SearchHeader />
        <Gallery searchResults={reduxSearchResults} hasSearched={hasSearched} />
        <Footer />
      </div>
    </>
  );
};

export default SearchIndexPage;
