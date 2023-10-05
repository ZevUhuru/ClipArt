import React from 'react';
import Image from 'next/image'; // Import the Image component
import HeroForm from './heroForm';


const HeroSection = () => {
    return (
        <div className="relative hero-container flex flex-col justify-center items-center sm:items-stretch md:items h-full w-full max-h-[500px] bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[600px]">
            {/* Use next/image as a background */}
            <Image
                src="https://assets.codepen.io/9394943/laughing-santa-2.png"
                alt="Hero Background"
                layout="fill"
                objectFit="cover" // This will act like background-size: cover
                quality={100}
                priority={true}
                className="z-0" // Place it behind your content
            />
            <div className="z-10 absolute flex flex-col justify-between h-full py-2.5 sm:relative sm:py-0  hero-content sm:ml-[50px]
">
                <h1 className="font-header text-white text-30 font-semibold text-shadow text-center sm:text-left p-1 max-w-[425px] sm:text-36">The Largest Collection <br />of Ai Generated Clip Art</h1>
                <HeroForm />
            </div>
        </div>
    )
}

export default HeroSection;
