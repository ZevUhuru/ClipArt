import React from 'react';
import Image from 'next/image';

function ImageGallery({ categoryTitle, images = [] }) {

    return (
        <div className="category-clipart bg-footer-gradient">
            <h2 id={`${categoryTitle.toLowerCase()}-clipart`} className="category-title w-full text-white flex justify-center text-2xl font-black p-[50px]">{`${categoryTitle} Clip Art`}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-footer-gradient p-[50px] pt-[0]">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`relative ${image.aspectRatio === '7:4' ? 'pb-[57.14%]' : 'pb-[100%]'}`} // Assuming a default aspect ratio of 4:3 if not 7:4
                    >
                        <Image
                            layout="fill"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33.33vw, 100vw"
                            className={`h-full w-full object-cover rounded-lg ${image.aspectRatio ? 'absolute top-0 left-0' : 'max-w-full'}`}
                            src={image.src}
                            alt={`Gallery Image ${index}`}
                            objectFit="cover"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ImageGallery;
