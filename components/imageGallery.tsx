import React from 'react';

function ImageGallery({ categoryTitle, images = [] }) {
    return (
        <div className="category-clipart bg-footer-gradient pt-[50px]">
            <h2 className="category-title w-full text-white flex justify-center text-2xl font-black">{`${categoryTitle} Clip Art`}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-footer-gradient p-[50px]">
                {images.map((image, index) => (
                    <div 
                        key={index} 
                        className={`relative ${image.aspectRatio === '7:4' ? 'pb-[57.14%]' : ''}`}
                    >
                        <img 
                            className={`h-full w-full object-cover rounded-lg ${image.aspectRatio ? 'absolute top-0 left-0' : 'max-w-full'}`} 
                            src={image.src} 
                            alt={`Gallery Image ${index}`} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}




export default ImageGallery;
