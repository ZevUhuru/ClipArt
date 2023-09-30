import React from 'react';
import Link from 'next/link';

import MenuIcon from 'src/components/Icons/menuIcon'
import CloseIcon from 'src/components/Icons/closeIcon'
import SearchForm from './searchForm'


const Navbar = ({ onSearchResults }) => {
    
    return (
        <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
            <div className="flex flex-wrap justify-between items-center">
                <div className="flex justify-start items-center">
                    <button
                        data-drawer-target="drawer-navigation"
                        data-drawer-toggle="drawer-navigation"
                        aria-controls="drawer-navigation"
                        className="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer md:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <CloseIcon />
                        <MenuIcon />
                        <span className="sr-only">Toggle sidebar</span>
                    </button>
                    <Link href="/search" className="flex mr-4 items-center justify-center">
                        <img
                            src="https://assets.codepen.io/9394943/color-logo-no-bg.svg"
                            className="mr-3 h-8"
                            alt="Flowbite Logo"
                        />
                    </Link>
                    <SearchForm onSearchResults={onSearchResults} />
                </div>
            </div>
        </nav>
    )
}

export default Navbar
