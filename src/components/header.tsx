import React, { useState } from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  // State to manage the dropdown's open/close state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle the dropdown's open/close state
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header>
      <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
        <div className="grid grid-cols-3 items-center mx-auto max-w-screen-xl">
          <Link href="/" className="flex items-center lg:justify-center lg:order-2">
            <img src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" className="mr-3 h-6 sm:h-9" alt="Flowbite Logo" />
          </Link>
          <div className="flex col-span-2 justify-end items-center lg:order-3 lg:col-span-1">
            {/* <Link href="/blog" className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">Blog</Link> */}
            <Link href="/login" className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">Login</Link>
            <Link href="/signup" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 lg:py-2.5 mr-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">Sign up</Link>
            <button onClick={toggleDropdown} type="button" className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
              <span className="sr-only">Open main menu</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
            </button>
          </div>
          <div className={isDropdownOpen ? 'col-span-3 justify-between items-center w-full lg:flex' : 'hidden col-span-3 justify-between items-center w-full lg:flex lg:w-auto lg:order-1 lg:col-span-1'} id="mobile-menu-2">
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <Link href="#food-clipart" className="block py-2 pr-4 pl-3 border-b border-gray-100 text-primary-600 dark:text-primary-500 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:p-0 dark:hover:bg-gray-700 dark:hover:text-primary-500 lg:dark:hover:bg-transparent dark:border-gray-700">Food</Link>
              </li>
              <li>
                <Link href="#christmas-clipart" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Christmas</Link>
              </li>
              <li>
                <Link href="#halloween-clipart" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Halloween</Link>
              </li>
              <li>
                <Link href="#cats-clipart" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Cats</Link>
              </li>

            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
