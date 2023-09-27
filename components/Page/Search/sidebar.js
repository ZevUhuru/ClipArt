import React, { useState } from 'react';

const Sidebar = () => {
    const [isPagesDropdownOpen, setPagesDropdownOpen] = useState(false);
    const [isSalesDropdownOpen, setSalesDropdownOpen] = useState(false);
    const [isAuthenticationDropdownOpen, setAuthenticationDropdownOpen] = useState(false);

    return (
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 md:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidenav" id="drawer-navigation">
            <div className="flex items-center justify-between px-4 mt-4">
                <a href="#" className="text-2xl font-semibold text-gray-900 dark:text-white">Brand</a>
                <button className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-white">
                    <span className="sr-only">Close menu</span>
                    <svg className="w-6 h-6 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <ul className="space-y-2">
                <li>
                    <button onClick={() => setPagesDropdownOpen(!isPagesDropdownOpen)} className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
                        Pages
                        <svg className="w-5 h-5 ml-auto text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    {isPagesDropdownOpen && (
                        <ul id="dropdown-pages" className="py-2 space-y-2">
                            {/* Add the links or content for the Pages dropdown here */}
                        </ul>
                    )}
                </li>
                <li>
                    <button onClick={() => setSalesDropdownOpen(!isSalesDropdownOpen)} className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
                        Sales
                        <svg className="w-5 h-5 ml-auto text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    {isSalesDropdownOpen && (
                        <ul id="dropdown-sales" className="py-2 space-y-2">
                            {/* Add the links or content for the Sales dropdown here */}
                        </ul>
                    )}
                </li>
                <li>
                    <button onClick={() => setAuthenticationDropdownOpen(!isAuthenticationDropdownOpen)} className="flex items-center p-2 w-full text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
                        Authentication
                        <svg className="w-5 h-5 ml-auto text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    {isAuthenticationDropdownOpen && (
                        <ul id="dropdown-authentication" className="py-2 space-y-2">
                            {/* Add the links or content for the Authentication dropdown here */}
                        </ul>
                    )}
                </li>
            </ul>
            <div className="flex items-center px-4 mt-8">
                <a href="#" className="flex items-center p-2 text-base font-medium text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.707 7.293a1 1 0 011.414 1.414L7.414 11l2.707 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3z" clipRule="evenodd"></path>
                    </svg>
                    Back to main
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
