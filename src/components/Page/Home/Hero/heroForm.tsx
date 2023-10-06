import React, { useState } from "react"
import SearchIcon from "src/components/Icons/searchIcon"
import { useSearchForm } from "src/hooks/useSearchForm"



export default function HeroForm() {
    const { searchQuery, handleInputChange, handleSubmit } = useSearchForm()

    return (
        <div className="search-container flex flex-col justify-end items-center w-full max-w-xl mt-[50px]">
            <form onSubmit={handleSubmit} className=" w-full flex items-center rounded">
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        value={searchQuery}
                        onChange={handleInputChange}
                        type="search"
                        id="default-search"
                        className="block w-full h-12 p-4 pl-10 text-sm sm:text-lg text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-2xl hover:shadow-3xl focus:outline-none focus:shadow-outline transition-shadow duration-300"
                        placeholder="Search for free clip art"
                        required
                    />
                    <button type="submit" className="h-[40px] top-[4px] text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                </div>
            </form>
        </div>
    )
}
