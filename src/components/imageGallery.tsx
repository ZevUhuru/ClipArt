import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
    const imagesToDisplay = hasSearched ? searchResults ?? [] : (defaultImages.length > 0 ? defaultImages : images);

    const extractAltFromUrl = (url) => {
        const match = url.match(/\/9\d{4,}\/(.*?)(?:\.png|\.jpg|\.jpeg)$/);
        return match && match[1] ? match[1].replace(/-/g, ' ') : 'Image';
    };

    const extractTitleFromUrl = (url: string): string => {
        if (!url) return 'Clip Art Image';
        const filename = url.split('/').pop() || '';
        return filename
            .replace(/\.(png|jpg|jpeg)$/i, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const generateSlugFromUrl = (url: string): string => {
        if (!url) return '';
        const filename = url.split('/').pop() || '';
        return filename
            .replace(/\.(png|jpg|jpeg)$/i, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    return (
        <main className="bg-footer-gradient dark:bg-gray-900 p-4 min-h-full flex flex-col justify-between">
            <h3 id={`${categoryTitle.toLowerCase()}-clipart`} className="category-title w-full text-white flex justify-center text-2xl sm:text-3xl font-black p-[50px]">{`${categoryTitle} Clip Art`}</h3>
            
            <div className="flex flex-grow items-center justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-6">
                    {imagesToDisplay.map((image, index) => {
                        const imageUrl = image?.src || image?.document?.image_url;
                        const imageSlug = image?.slug || generateSlugFromUrl(imageUrl);
                        const categorySlug = categoryTitle.toLowerCase();
                        const imageLink = `/${categorySlug}/${imageSlug}`;
                        
                        return (
                            <Link 
                                key={index} 
                                href={imageLink}
                                className="rounded-lg mb-4 max-w-[516px] bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group block"
                            >
                                <div className="relative">
                                    <Image
                                        src={imageUrl}
                                        alt={extractAltFromUrl(imageUrl)}
                                        width={500}
                                        height={500}
                                        className="rounded-lg shadow-md border-gray-300 group-hover:shadow-lg transition-shadow"
                                        priority={index < 3}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded transition-opacity">
                                            Click to view & download
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

export default ImageGallery;