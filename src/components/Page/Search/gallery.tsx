import React from 'react';
import Image from 'next/image';



type GalleryProps = {
    searchResults: any[]; // You can replace 'any' with a more specific type if you know the structure of the search results.
    hasSearched: boolean;
    defaultImages: any[];
  };

  

const Gallery: React.FC<GalleryProps> = ({ searchResults, hasSearched, defaultImages }) => {

    const imagesToDisplay = hasSearched ? searchResults : defaultImages;

    const extractAltFromUrl = (url) => {
        const match = url.match(/\/9\d{4,}\/(.*?)(?:\.png|\.jpg|\.jpeg)$/);
        return match && match[1] ? match[1].replace(/-/g, ' ') : 'Image';
    };
    

    // const renderImages = (count, height) => {
    //     return searchResults.slice(0, count).map((result, index) => (
    //         <div key={index} className={`relative rounded-lg dark:border-gray-600 ${height}`}>
    //             <Image 
    //                 src={result?.document?.image_url || ''} 
    //                 alt={result?.document ? extractAltFromUrl(result.document.image_url) : 'Image'} 
    //                 layout="fill" 
    //                 objectFit="cover" 
    //             />
    //         </div>
    //     ));
    // }
    

    return (
        <main className="bg-gray-50 dark:bg-gray-900 p-4 lg:mr-16 min-h-full pt-20">
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {imagesToDisplay.map((image, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded-lg">
                        <Image 
                            src={image.src || image.document?.image_url} 
                            alt={extractAltFromUrl(image.src || image.document?.image_url)} 
                            width={500} 
                            height={500} 
                            className="rounded-lg shadow-md border border-gray-300"
                        />
                    </div>
                ))}
            </div>
        </main>
    );
}

export default Gallery;
