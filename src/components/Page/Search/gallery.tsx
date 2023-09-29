import React from 'react';



const Gallery = () => {
    const renderDivs = (count, height) => {
        return Array(count).fill().map((_, index) => (
            <div key={index} className={`border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600 ${height}`}></div>
        ))
    }

    return (
        <main className="bg-gray-50 dark:bg-gray-900 p-4 md:ml-64 lg:mr-16 min-h-full pt-20">
            <div className="grid grid-cols-3 gap-4 mb-4">
                {renderDivs(3, "h-32 lg:h-64")}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600 h-96 mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {renderDivs(4, "h-48 lg:h-72")}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600 h-96 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
                {renderDivs(4, "h-48 lg:h-72")}
            </div>
        </main>
    )
}

export default Gallery
