import React from "react"
import Link from "next/link"



export default function SearchMenu({ isMenuOpen, handleCompanyDropdownToggle, isCompanyDropdownOpen, handleDesignDropdownToggle, isDesignDropdownOpen }) {
    return (
        <div className={`${isMenuOpen ? '' : 'hidden'} justify-between items-center w-full lg:flex lg:w-auto lg:order-1`} id="mobile-menu-2">
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">

                <li>
                    <button
                        id="mega-menu-button"
                        data-dropdown-toggle="mega-menu"
                        className="flex justify-between items-center py-2 pr-4 pl-3 w-full font-medium text-gray-700 border-b border-gray-100 lg:w-auto hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-600 lg:p-0 dark:text-gray-400 lg:dark:hover:text-primary-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                        onClick={handleDesignDropdownToggle}
                    >
                        Designs
                        <svg className="ml-1 w-5 h-5 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    <div
                        id="mega-menu"
                        className={`grid ${isDesignDropdownOpen ? '' : 'hidden'} absolute z-10 w-full bg-white border border-gray-100 shadow-md dark:border-gray-700 lg:rounded-lg lg:w-auto lg:grid-cols-2 dark:bg-gray-700`}
                    >
                        <div className="p-2 text-gray-900 bg-white lg:rounded-lg dark:text-white lg:col-span-2 dark:bg-gray-800">
                            <ul>
                                <li>
                                    <Link href="#food-clipart" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Food</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Yummy clip art designs that will satisfy your craves</div>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <a href="#christmas-clipart" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Christmas</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Embrace the Christmas spirit this holiday season</div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="#halloween-clipart" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Halloween</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Are you ready for Trick or Treat? 😱</div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="#flowers-clipart" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"></path><path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Flowers</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Explore vibrant and colorful flower clip art</div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="#cats-clipart" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Cats</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Playful and adorable deisgns of cats and kittens</div>
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>
                </li>

                <li>
                    <Link href="/search" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-600 lg:p-0 dark:text-gray-400 lg:dark:hover:text-primary-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Marketplace</Link>
                </li>
                <li>
                    <button
                        id="mega-menu-button"
                        data-dropdown-toggle="mega-menu"
                        className="flex justify-between items-center py-2 pr-4 pl-3 w-full font-medium text-gray-700 border-b border-gray-100 lg:w-auto hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-600 lg:p-0 dark:text-gray-400 lg:dark:hover:text-primary-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                        onClick={handleCompanyDropdownToggle}
                    >
                        Education
                        <svg className="ml-1 w-5 h-5 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                    </button>
                    <div
                        id="mega-menu"
                        className={`grid ${isCompanyDropdownOpen ? '' : 'hidden'} absolute z-10 w-full bg-white border border-gray-100 shadow-md dark:border-gray-700 lg:rounded-lg lg:w-auto lg:grid-cols-3 dark:bg-gray-700`}
                    >
                        <div className="p-2 text-gray-900 bg-white lg:rounded-lg dark:text-white lg:col-span-2 dark:bg-gray-800">
                            <ul>
                                <li>
                                    <Link href="/learn" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"></path><path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Clip.Art Blog</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Interviews, tutorials, and more</div>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/learn" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Explore Themes</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Trending designs to inspire you</div>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/learn" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="p-2 mr-4 bg-white rounded-lg shadow dark:bg-gray-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold">Prompt Engineering</div>
                                            <div className="text-sm font-light text-gray-500 dark:text-gray-400">Get the best out of Ai Art Generation</div>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="py-5 px-5 bg-gray-50 lg:rounded-lg lg:col-span-1 dark:bg-gray-700">
                            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Browse designs</h3>
                            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                                <li>
                                    <a href="#food-clipart" className="hover:text-primary-600 dark:hover:text-primary-500">Food</a>
                                </li>
                                <li>
                                    <a href="#christmas-clipart" className="hover:text-primary-600 dark:hover:text-primary-500">Christmas</a>
                                </li>
                                <li>
                                    <a href="#halloween-clipart" className="hover:text-primary-600 dark:hover:text-primary-500">Halloween</a>
                                </li>
                                <li>
                                    <a href="#flower-clipart" className="hover:text-primary-600 dark:hover:text-primary-500">Flowers</a>
                                </li>
                                <li>
                                    <a href="#cats-clipart" className="hover:text-primary-600 dark:hover:text-primary-500">Cats</a>
                                </li>
                                {/* <li>
                                <a href="#" className="hover:text-primary-600 dark:hover:text-primary-500">Product Design</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary-600 dark:hover:text-primary-500">Web Design</a>
                            </li> */}
                            </ul>
                        </div>
                    </div>
                </li>
                {/* <li>
                <a href="#" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-600 lg:p-0 dark:text-gray-400 lg:dark:hover:text-primary-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Team</a>
            </li>
            <li>
                <a href="#" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-600 lg:p-0 dark:text-gray-400 lg:dark:hover:text-primary-500 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">Contact</a>
            </li> */}
            </ul>
        </div>
    )
}