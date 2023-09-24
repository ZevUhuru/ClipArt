import React from 'react';

function ImageGallery() {
    const images = [
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg",
        "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg"
    ];

    return (
        <div className="category-clipart bg-footer-gradient pt-[50px]">
            <h2 className="category-title w-full text-white flex justify-center text-2xl font-black">Christmas Clip Art</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-footer-gradient p-[50px]">
                {images.map((src, index) => (
                    <div key={index}>
                        <img className="h-auto max-w-full rounded-lg" src={src} alt={`Gallery Image ${index}`} />
                    </div>
                ))}
            </div>
        </div>


    );
}

export default ImageGallery;
