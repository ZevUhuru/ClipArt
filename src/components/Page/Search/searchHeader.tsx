import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchForm from './searchForm';




const categories = [
    'Christmas', 'Halloween', 'Flowers', 'New Years', 'Food', 'Cats', 'Heart', 'Birthday'
];


const SearchHeader = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownVisible && !event.target.closest('#dropdownDefault')) {
                setDropdownVisible(false);
            }
        };

        window.addEventListener('click', handleOutsideClick);

        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [dropdownVisible]);



    return (
        <>
            <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
                <div className="flex flex-wrap justify-between items-center">
                    <div className="flex justify-start items-center w-full">
                        <Link href="/search">
                            <div className="flex mr-4 items-center justify-center">
                                <img
                                    src="https://assets.codepen.io/9394943/color-logo-no-bg.svg"
                                    className="mr-3 h-8"
                                    alt="Flowbite Logo"
                                />
                            </div>
                        </Link>
                        <SearchForm />
                    </div>
                </div>
            </nav>
            <nav className="bg-gray-50 dark:bg-gray-700 mt-14 p-2">
                <div className="py-3 px-4 max-w-screen-xl md:px-6">
                    <div className="flex items-center relative">
                        <ul className="flex flex-row mt-0 mr-6 space-x-8 text-sm font-medium">
                            {categories.map((category, index) => (
                                <li key={index} className={`${index > 3 ? 'hidden md:inline' : ''}`}>
                                    <Link href={`/search/${category.toLowerCase()} clip art`} className="text-gray-900 dark:text-white hover:underline">
                                        {category}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <button
                            id="dropdownDefault"
                            onClick={toggleDropdown}
                            className="relative z-10 text-gray-500 md:hidden dark:hover:bg-gray-600 dark:text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-full text-sm p-1.5"
                        >
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>

                        </button>
                        <div
                            id="dropdown"
                            className={`${dropdownVisible ? '' : 'hidden'} absolute top-8 -right-2 z-50 mt-2 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700`}
                        >
                            <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefault">
                                {categories.slice(4).map((category, index) => (
                                    <li key={index}>
                                        <Link href={`/search/${category.toLowerCase()} clip art`} className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            {category}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default SearchHeader;
