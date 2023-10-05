import React from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { getDefaultResults } from 'src/selectors/searchSelectors';

type GalleryProps = {
    searchResults: any[];
    hasSearched: boolean;
};

const Gallery: React.FC<GalleryProps> = ({ searchResults }) => {
    const defaultResults = useSelector(getDefaultResults)
    let imagesToDisplay

   if (!searchResults.length) {
    imagesToDisplay = defaultResults;
    } else {
        imagesToDisplay = searchResults;
    }


    return (
        <main className="bg-gray-50 dark:bg-gray-900 p-4 lg:mr-16 min-h-full pt-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {imagesToDisplay?.map((image, index) => (
                    <div key={image.id} className="p-2 bg-gray-100 rounded-lg">
                        <Image 
                            src={image.image_url} 
                            alt={image.title || 'Image'} 
                            width={500} 
                            height={500} 
                            className="rounded-lg shadow-md border border-gray-300"
                            priority={index < 3} // Prioritize loading of the first 3 images
                        />
                    </div>
                ))}
            </div>
        </main>
    );
}

export default Gallery;
