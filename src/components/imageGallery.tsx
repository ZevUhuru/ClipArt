import React, { useState } from 'react';
import Image from 'next/image';
import ImageDetailModal from './ImageDetailModal';

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
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleImageClick = (image: any) => {
        const imageUrl = image?.src || image?.document?.image_url;
        const imageTitle = extractTitleFromUrl(imageUrl);
        setSelectedImage({ url: imageUrl, title: imageTitle });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };

    return (
        <>
            <main className="bg-footer-gradient dark:bg-gray-900 p-4 min-h-full flex flex-col justify-between">
                <h3 id={`${categoryTitle.toLowerCase()}-clipart`} className="category-title w-full text-white flex justify-center text-2xl sm:text-3xl font-black p-[50px]">{`${categoryTitle} Clip Art`}</h3>
                
                <div className="flex flex-grow items-center justify-center">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-6">
                        {imagesToDisplay.map((image, index) => {
                            const imageUrl = image?.src || image?.document?.image_url;
                            return (
                                <div 
                                    key={index} 
                                    className="rounded-lg mb-4 max-w-[516px] bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group"
                                    onClick={() => handleImageClick(image)}
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
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Image Detail Modal */}
            {selectedImage && (
                <ImageDetailModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    imageUrl={selectedImage.url}
                    imageTitle={selectedImage.title}
                    category={categoryTitle}
                />
            )}
        </>
    );
}

export default ImageGallery;