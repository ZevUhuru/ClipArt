import React, { useState } from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { getDefaultResults } from 'src/selectors/searchSelectors';

// HeartIcon Component
const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364l-1.2 1.2-1.2-1.2a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

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

  return (
    <main className="bg-gray-50 dark:bg-gray-900 p-4 lg:ml-16 lg:mr-16 min-h-full pt-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 mb-4">
        {imagesToDisplay?.map((item, index) => {
          const image = item.document ? item.document : item;
          const [isFavorited, setFavorited] = useState(false);

          const toggleFavorite = () => {
            setFavorited(!isFavorited);
          };

          return (
            <div
              key={image.id || index}
              className="p-1 bg-gray-100 rounded-lg relative group cursor-pointer overflow-hidden"
            >
              <div
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-footer-gradient p-1 rounded-full"
                onClick={toggleFavorite}
              >
                <HeartIcon className={`${isFavorited ? 'text-red-500 w-6 h-6' : 'text-white w-6 h-6'}`} />
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
              <div className="absolute bottom-0 bg-footer-gradient w-full text-center py-1 text-white group-hover:opacity-100 opacity-0 transition-opacity">
                <p className="truncate">{image.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default Gallery;
