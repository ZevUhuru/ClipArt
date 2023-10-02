import React from 'react';
import Image from 'next/image'; // Import the Image component
import SearchIcon from 'src/components/Icons/searchIcon';

const HeroSection = () => {
    return (
        <div className="relative hero-container flex flex-col justify-center items-center sm:items-stretch md:items h-full w-full max-h-[500px] bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[600px]">
            {/* Use next/image as a background */}
            <Image
                src="https://assets.codepen.io/9394943/laughing-santa-2.png"
                alt="Hero Background"
                layout="fill"
                objectFit="cover" // This will act like background-size: cover
                quality={100}
                priority={true}
                className="z-0" // Place it behind your content
            />
            <div className="z-10 absolute flex flex-col justify-between h-full py-2.5 sm:relative sm:py-0  hero-content sm:ml-[50px]
">
                <h1 className="text-white text-30 font-semibold font-sans text-shadow  p-1 max-w-[425px] md:text-[36px]">The Largest Collection <br />of Ai Generated Clip Art</h1>
                <div className="search-container flex flex-col justify-end items-center w-full max-w-xl mt-[50px]">
                    <form className="w-full flex items-center rounded">
                        <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="search"
                                id="default-search"
                                className="block w-full h-12 p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-2xl hover:shadow-3xl focus:outline-none focus:shadow-outline transition-shadow duration-300"
                                placeholder="Search for free clip art"
                                required
                            />
                            <button type="submit" className="h-[40px] top-[4px] text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default HeroSection;
