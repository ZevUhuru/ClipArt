import React from 'react';

function ImageGallery({ categoryTitle }) {
    const images = [
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
        "https://assets.codepen.io/9394943/watermark-clipart-cat.png",
    ];

    return (
        <div className="category-clipart bg-footer-gradient pt-[50px]">
            <h2 className="category-title w-full text-white flex justify-center text-2xl font-black">{`${categoryTitle} Clip Art`}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-footer-gradient p-[50px]">
                {images.map((src, index) => (
                    <div key={index}>
                        <img className="h-full max-w-full rounded-lg" src={src} alt={`Gallery Image ${index}`} />
                    </div>
                ))}
            </div>
        </div>


    );
}

export default ImageGallery;
