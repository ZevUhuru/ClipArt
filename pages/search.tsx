import React from 'react';
import Navbar from 'src/components/Page/Search/navbar';
import Sidebar from 'src/components/Page/Search/sidebar';
import Main from 'src/components/Page/Search/main';

const SearchPage = () => {
    return (
        <>
            <div className="antialiased bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <Sidebar />

                <Main />
            </div>
        </>
    );
};

export default SearchPage;
