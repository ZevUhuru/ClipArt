import React from 'react';
import Image from 'next/image';

const Gallery = () => {
    const imagesArray = [
        { src: "https://assets.codepen.io/9394943/pecan-pie-illustration.png" },
        { src: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg-2.png" },
        { src: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg.png" },
        { src: "https://assets.codepen.io/9394943/produce-basket-illustration-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/thanksgiving-illustration-1-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/pancake-illustration-1-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/sitting-santa-illustration.png" },
        { src: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/life-like-santa-illustration-1-wbg.png" },
        { src: "https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png",  aspectRatio:  '7:4' },
        { src: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png", aspectRatio:  '7:4'},
        { src: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png", aspectRatio:  '7:4' },
        { src: "https://assets.codepen.io/9394943/witch-pencil-style-clip-art-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/african-witch-with-broomstick-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/two-halloween-clip-art-pumpkins-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/halloween-clip-art-ghost-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/halloween-clipart-voodoo-dollas-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/halloween-clipart-ghost-pumpkin-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/white-rose-woman-hair-flower-clipart.png" },
        { src: "https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png" },
        { src: "https://assets.codepen.io/9394943/young-girl-holding-flowers-clipart-white-bg.png" }, 
        { src: "https://assets.codepen.io/9394943/pink-rose-flower-clipart-white-bg.png" },
        { src: "https://assets.codepen.io/9394943/hawaiian-biscus-flower-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/single-smiling-sunflower-emoji-flower-clipart.png" },
        { src: "https://assets.codepen.io/9394943/two-kittens-playing-with-golf-balls-in-paint-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/cute-kittens-holding-golf-clubs-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/kitten-holding-dumbbell-cat-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/cats-laying-in-fruit-basket-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/cute-himalayan-kittens-playing-with-golf-balls-clip-art.png" },
        { src: "https://assets.codepen.io/9394943/cute-cats-cuddling-clip-art.png" }
      ];
      

    const extractAltFromUrl = (url) => {
        const match = url.match(/\/9\d{4,}\/(.*?)(?:\.png|\.jpg|\.jpeg)$/);
        return match && match[1] ? match[1].replace(/-/g, ' ') : 'Image';
    };
    

    const renderImages = (count, height) => {
        return imagesArray.slice(0, count).map((image, index) => (
            <div key={index} className={`relative rounded-lg dark:border-gray-600 ${height}`}>
                <Image src={image.src} alt={extractAltFromUrl(image.src)} layout="fill" objectFit="cover" />
            </div>
        ));
    }

    return (
        <main className="bg-gray-50 dark:bg-gray-900 p-4 md:ml-64 lg:mr-16 min-h-full pt-20">
            <div className="grid grid-cols-3 gap-4 mb-4">
                {imagesArray.map((image, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded-lg">
                        <Image 
                            src={image.src} 
                            alt={extractAltFromUrl(image.src)} 
                            width={500} 
                            height={500} 
                            className="rounded-lg shadow-md border border-gray-300"
                        />
                    </div>
                ))}
            </div>
        </main>
    );
}

export default Gallery;
