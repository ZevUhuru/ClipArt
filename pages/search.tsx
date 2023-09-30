import React from 'react';
import Navbar from 'src/components/Page/Search/navbar';
import Sidebar from 'src/components/Page/Search/sidebar';
import Gallery from 'src/components/Page/Search/gallery';

const SearchPage = () => {
    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900">
                <Navbar />
                {/* <Sidebar /> */}
                <Gallery />
            </div>
        </>
    );
};

export default SearchPage;
