

import React from 'react';

const MainSidebar = () => {
    const newsItems = [
        {
            imageUrl: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/articles/image-1.png",
            altText: "Image 1",
            title: "Our first office",
            description: "Over the past year, Volosoft has undergone changes.",
            readTime: "Read in 9 minutes"
        },
        {
            imageUrl: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/articles/image-2.png",
            altText: "Image 2",
            title: "Enterprise Design tips",
            description: "Over the past year, Volosoft has undergone changes.",
            readTime: "Read in 14 minutes"
        },
        {
            imageUrl: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/articles/image-3.png",
            altText: "Image 3",
            title: "Partnered up with Google",
            description: "Over the past year, Volosoft has undergone changes.",
            readTime: "Read in 9 minutes"
        }
    ];

    return (
        <aside className="hidden xl:block" aria-labelledby="sidebar-label">
            <div className="xl:w-[336px] sticky top-6">
                <h3 id="sidebar-label" className="sr-only">Sidebar</h3>
                <div className="mb-8">
                    <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-white uppercase">Flowbite News morning headlines</h4>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Get all the stories you need-to-know from the most powerful name in news delivered first thing every morning to your inbox</p>
                    <button type="button" data-modal-toggle="newsletter-modal" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800 text-center w-full">Subscribe</button>
                </div>
            </div>
               
            <div className="mb-12">
                <h4 className="mb-4 text-sm font-bold text-gray-900 dark:text-white uppercase">Latest news</h4>
                {newsItems.map((item, index) => (
                    <div key={index} className="mb-6 flex items-center">
                        <a href="#" className="shrink-0">
                            <img src={item.imageUrl} className="mr-4 max-w-full w-24 h-24 rounded-lg" alt={item.altText} />
                        </a>
                        <div>
                            <h5 className="mb-2 text-lg font-bold leading-tight dark:text-white text-gray-900">{item.title}</h5>
                            <p className="mb-2 text-gray-500 dark:text-gray-400">{item.description}</p>
                            <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                                {item.readTime}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
            <div>
                    <a href="#" className="flex justify-center items-center mb-3 w-full h-48 bg-gray-100 rounded-lg dark:bg-gray-700">
                        <svg aria-hidden="true" className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                    </a>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Students and Teachers, save up to 60% on Flowbite Creative Cloud.</p>
                    <p className="text-xs text-gray-400 uppercase dark:text-gray-500">Ads placeholder</p>
                </div>
        </aside>
    );
}

export default MainSidebar;
