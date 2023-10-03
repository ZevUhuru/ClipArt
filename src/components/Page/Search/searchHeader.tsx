import React, { useState } from 'react';
import Link from 'next/link';
import SearchForm from './searchForm';

const SearchHeader = () => {
    return (
        <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
            <div className="flex flex-wrap justify-between items-center">
                <div className="flex justify-start items-center w-full">
                    <Link href="/search" className="flex mr-4 items-center justify-center">
                        <img
                            src="https://assets.codepen.io/9394943/color-logo-no-bg.svg"
                            className="mr-3 h-8"
                            alt="Flowbite Logo"
                        />
                    </Link>
                    <SearchForm  />
                </div>
            </div>
        </nav>
    );
};

export default SearchHeader;
