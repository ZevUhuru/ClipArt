import React, { useState } from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { getDefaultResults } from 'src/selectors/searchSelectors';
import { Modal, Tooltip } from 'flowbite-react';
import HeartIcon from 'src/components/Icons/heartIcon';

interface GalleryProps {
    searchResults: any;
}

const Gallery: React.FC<GalleryProps> = ({ searchResults }) => {
    const defaultResults = useSelector(getDefaultResults);
    let imagesToDisplay;

    if (!searchResults.length) {
        imagesToDisplay = defaultResults;
    } else {
        imagesToDisplay = searchResults;
    }

    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (image) => {
        setSelectedImage(image);
        setModalOpen(true);
    };

    const truncateTitle = (title) => {
        return title.length > 30 ? `${title.substring(0, 27)}...` : title;
    };

    return (
        <main className="bg-gray-50 dark:bg-gray-900 p-4 lg:ml-16 lg:mr-16 min-h-full pt-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-4">
                {imagesToDisplay?.map((item, index) => {
                    const image = item.document ? item.document : item;
                    const truncatedTitle = truncateTitle(image.title);

                    return (
                        <div
                            key={image.id || index}
                            className="rounded-lg relative group cursor-pointer overflow-hidden"
                            onClick={() => openModal(image)}
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-footer-gradient p-1 rounded-full">
                                <HeartIcon className="text-white w-6 h-6" />
                            </div>
                            <Image
                                src={image.image_url || ''}
                                alt={image.title || 'Image'}
                                width={500}
                                height={500}
                                className="rounded-lg shadow-md border border-gray-300"
                                priority={index < 3}
                                layout="responsive"
                            />
                            <div className="absolute bottom-0 bg-footer-gradient w-full flex items-center justify-center py-1 text-white group-hover:opacity-100 opacity-0 transition-opacity">
                                <Tooltip content={image.title} className="text-xs sm:text-sm md:text-base">
                                    <p className="truncate text-center text-sm sm:text-base md:text-lg">{truncatedTitle}</p>
                                </Tooltip>
                            </div>
                        </div>
                    );
                })}
            </div>
            {isModalOpen && selectedImage && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex justify-between">
                            <div className="text-gray-700">{selectedImage.title}</div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-red-500"
                            >
                                <HeartIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <img
                            src={selectedImage.image_url}
                            alt={selectedImage.title}
                            className="mt-4"
                        />
                    </div>
                </div>
            )}
        </main>
    );
};

export default Gallery;
