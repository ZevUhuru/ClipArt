import React from 'react';
import Image from 'next/image';

type ImageGalleryProps = {
    categoryTitle: string;
    images: any[];
    searchResults?: any[];
    hasSearched?: boolean;
    defaultImages?: any[];
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
    categoryTitle,
    images = [],
    searchResults,
    hasSearched = false,
    defaultImages = []
}) => {

    // Check for search results, then default images, then props images.
    const imagesToDisplay = hasSearched ? searchResults : (defaultImages.length > 0 ? defaultImages : images);

    const extractAltFromUrl = (url) => {
        const match = url.match(/\/9\d{4,}\/(.*?)(?:\.png|\.jpg|\.jpeg)$/);
        return match && match[1] ? match[1].replace(/-/g, ' ') : 'Image';
    };

    return (
        <main className="bg-black dark:bg-gray-900 p-4 min-h-full flex flex-col justify-between">
        <h2 id={`${categoryTitle.toLowerCase()}-clipart`} className="category-title w-full text-white flex justify-center text-2xl font-black p-[50px]">{`${categoryTitle} Clip Art`}</h2>
        
        <div className="flex flex-grow items-center justify-center "> {/* Added this container */}
            <div className="grid grid-cols-3 xl:grid-cols-3 gap-4">
                {imagesToDisplay.map((image, index) => (
                    <div key={index} className="rounded-lg mb-4 max-w-[516px] p-1 bg-gray-100 ">
                        <Image
                            src={image.src || image.document?.image_url}
                            alt={extractAltFromUrl(image.src || image.document?.image_url)}
                            width={500}
                            height={500}
                            className="rounded-lg shadow-md border border-gray-300"
                            priority={index < 3} // Prioritize loading of the first 3 images
                        />
                    </div>
                ))}
            </div>
        </div>
    </main>
    );
}

export default ImageGallery;
