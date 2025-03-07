import React from "react";
import MainSidebar from "./mainSidebar";

import Link from "next/link";

const MainSection = () => {
    return (
        <main className="pb-16 lg:pb-24 bg-white dark:bg-gray-900 antialiased">
            <header className="bg-[url('https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png')] w-full h-[460px] xl:h-[537px] bg-no-repeat bg-cover bg-center bg-blend-darken relative">
                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50"></div>
                <div className="absolute top-20 left-1/2 px-4 mx-auto w-full max-w-screen-xl -translate-x-1/2 xl:top-1/2 xl:-translate-y-1/2 xl:px-0">
                    <span className="block mb-4 text-gray-300">Published in <a href="#" className="font-semibold text-white hover:underline">Ai Art Tutorials</a></span>
                    <h1 className="mb-4 max-w-4xl text-2xl font-extrabold leading-none text-white sm:text-3xl lg:text-4xl">How to Generate Royalty Free Christmas Clip Art using Ai</h1>
                    {/* <p className="text-lg font-normal text-gray-300">Before going digital, you might scribbling down some ideas in a sketchbook.</p> */}
                </div>
            </header>
            <div className="flex relative z-20 justify-between p-6 -m-36 mx-4 max-w-screen-xl bg-white dark:bg-gray-800 rounded xl:-m-32 xl:p-9 xl:mx-auto">
                <article className="xl:w-[828px] w-full max-w-none format format-sm sm:format-base lg:format-lg format-blue dark:format-invert">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center">
                        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 text-base mb-2 lg:mb-0">
                            <span>By <a href="#" className="text-gray-900 dark:text-white hover:underline no-underline font-semibold">Lem Uhuru</a></span>
                            <span className="bg-gray-300 dark:bg-gray-400 w-2 h-2 rounded-full"></span>
                            <span><time className="font-normal text-gray-500 dark:text-gray-400 uppercase"  dateTime="2022-03-08" title="August 3rd, 2022">December , 2023, 2:20am EDT</time></span>
                        </div>
                        <aside aria-label="Share social media">
                            <div className="not-format">
                                <button data-tooltip-target="tooltip-facebook" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 8 19">
                                        <path fillRule="evenodd" d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <div id="tooltip-facebook" role="tooltip" className="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                                    Share on Facebook
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div>

                                <button data-tooltip-target="tooltip-twitter" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path fill="currentColor" d="M12.186 8.672 18.743.947h-2.927l-5.005 5.9-4.44-5.9H0l7.434 9.876-6.986 8.23h2.927l5.434-6.4 4.82 6.4H20L12.186 8.672Zm-2.267 2.671L8.544 9.515 3.2 2.42h2.2l4.312 5.719 1.375 1.828 5.731 7.613h-2.2l-4.699-6.237Z" />
                                    </svg>
                                </button>
                                <div id="tooltip-twitter" role="tooltip" className="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                                    Share on Twitter
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div>
{/* 
                                <button data-tooltip-target="tooltip-reddit" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_13676_82300)">
                                            <path d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18Z" />
                                            <path d="M15.0004 8.99997C15.0004 8.27365 14.411 7.68418 13.6846 7.68418C13.3267 7.68418 13.011 7.82102 12.7794 8.0526C11.8846 7.41049 10.6425 6.98944 9.27412 6.93681L9.87412 4.12628L11.8215 4.53681C11.8425 5.03155 12.2531 5.43155 12.7583 5.43155C13.2741 5.43155 13.6952 5.01049 13.6952 4.4947C13.6952 3.97891 13.2741 3.55786 12.7583 3.55786C12.3899 3.55786 12.0741 3.76839 11.9267 4.08418L9.7478 3.62102C9.68464 3.61049 9.62148 3.62102 9.56885 3.6526C9.51622 3.68418 9.48464 3.73681 9.46359 3.79997L8.80043 6.93681C7.40043 6.97891 6.1478 7.38944 5.24254 8.0526C5.01096 7.83155 4.68464 7.68418 4.33727 7.68418C3.61096 7.68418 3.02148 8.27365 3.02148 8.99997C3.02148 9.53681 3.33727 9.98944 3.80043 10.2C3.77938 10.3263 3.76885 10.4631 3.76885 10.6C3.76885 12.621 6.11622 14.2526 9.02149 14.2526C11.9267 14.2526 14.2741 12.621 14.2741 10.6C14.2741 10.4631 14.2636 10.3368 14.2425 10.2105C14.6741 9.99997 15.0004 9.53681 15.0004 8.99997ZM6.00043 9.93681C6.00043 9.42102 6.42148 8.99997 6.93727 8.99997C7.45306 8.99997 7.87412 9.42102 7.87412 9.93681C7.87412 10.4526 7.45306 10.8737 6.93727 10.8737C6.42148 10.8737 6.00043 10.4526 6.00043 9.93681ZM11.232 12.4105C10.5899 13.0526 9.36885 13.0947 9.01096 13.0947C8.65306 13.0947 7.42148 13.0421 6.7899 12.4105C6.69517 12.3158 6.69517 12.1579 6.7899 12.0631C6.88464 11.9684 7.04254 11.9684 7.13727 12.0631C7.53727 12.4631 8.40043 12.6105 9.02149 12.6105C9.64254 12.6105 10.4952 12.4631 10.9057 12.0631C11.0004 11.9684 11.1583 11.9684 11.2531 12.0631C11.3267 12.1684 11.3267 12.3158 11.232 12.4105ZM11.0636 10.8737C10.5478 10.8737 10.1267 10.4526 10.1267 9.93681C10.1267 9.42102 10.5478 8.99997 11.0636 8.99997C11.5794 8.99997 12.0004 9.42102 12.0004 9.93681C12.0004 10.4526 11.5794 10.8737 11.0636 10.8737Z" fill="white" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_13676_82300">
                                                <rect width="18" height="18" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </button>
                                <div id="tooltip-reddit" role="tooltip" className="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                                    Post on Reddit
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div> */}
{/* 
                                <button data-tooltip-target="tooltip-link" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 19 19">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.013 7.962a3.519 3.519 0 0 0-4.975 0l-3.554 3.554a3.518 3.518 0 0 0 4.975 4.975l.461-.46m-.461-4.515a3.518 3.518 0 0 0 4.975 0l3.553-3.554a3.518 3.518 0 0 0-4.974-4.975L10.3 3.7" />
                                    </svg>
                                </button>
                                <div id="tooltip-link" role="tooltip" className="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                                    Share link
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div> */}

                                {/* <button data-tooltip-target="tooltip-save" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m13 19-6-5-6 5V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17Z" />
                                    </svg>
                                </button>
                                <div id="tooltip-save" role="tooltip" className="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                                    Save this article
                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                </div> */}
                                {/* <button id="dropdownMenuIconHorizontalButton" data-dropdown-toggle="dropdownDotsHorizontal" className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600" type="button">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 3">
                                        <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                                    </svg>
                                </button>
                                <div id="dropdownDotsHorizontal" className="hidden z-10 w-36 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">
                                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownMenuIconHorizontalButton">
                                        <li>
                                            <a href="#" className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Add to collection</a>
                                        </li>
                                        <li>
                                            <a href="#" className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Report</a>
                                        </li>
                                    </ul>
                                </div> */}
                            </div>
                        </aside>
                    </div>
                    <p className="lead">Flowbite is an open-source library of UI components built with the utility-first
                        classNamees from Tailwind CSS. It also includes interactive elements such as dropdowns, modals,
                        datepickers.</p>
                    <p>Before going digital, you might benefit from scribbling down some ideas in a sketchbook. This way,
                        you can think things through before committing to an actual design project.</p>
                    <p>But then I found a <Link href="/">component library based on Tailwind CSS called
                        Flowbite</Link>. It comes with the most commonly used UI components, such as buttons, navigation
                        bars, cards, form elements, and more which are conveniently built with the utility classNamees from
                        Tailwind CSS.</p>
                    <figure><img src="https://assets.codepen.io/9394943/life-like-santa-illustration-1-wbg.png" alt="" className="mx-auto" />
                        <figcaption>Digital art by Anonymous</figcaption>
                    </figure>
                    <h2>Getting started with Flowbite</h2>
                    <p>First of all you need to understand how Flowbite works. This library is not another framework.
                        Rather, it is a set of components based on Tailwind CSS that you can just copy-paste from the
                        documentation.</p>
                    <p>It also includes a JavaScript file that enables interactive components, such as modals, dropdowns,
                        and datepickers which you can optionally include into your project via CDN or NPM.</p>
                    <p>You can check out the <Link href="/">quickstart
                        guide</Link> to explore the elements by including the CDN files into your project. But if you want
                        to build a project with Flowbite I recommend you to follow the build tools steps so that you can
                        purge and minify the generated CSS.</p>
                    <p>You'll also receive a lot of useful application UI, marketing UI, and e-commerce pages that can help
                        you get started with your projects even faster. You can check out this <Link
                            href="/">comparison table</Link> to better understand
                        the differences between the open-source and pro version of Flowbite.</p>
                    <h2>When does design come in handy?</h2>
                    <p>While it might seem like extra work at a first glance, here are some key moments in which prototyping
                        will come in handy:</p>
                    <ol>
                        <li><strong>Usability testing</strong>. Does your user know how to exit out of screens? Can they
                            follow your intended user journey and buy something from the site you’ve designed? By running a
                            usability test, you’ll be able to see how users will interact with your design once it’s live;
                        </li>
                        <li><strong>Involving stakeholders</strong>. Need to check if your GDPR consent boxes are displaying
                            properly? Pass your prototype to your data protection team and they can test it for real;</li>
                        <li><strong>Impressing a client</strong>. Prototypes can help explain or even sell your idea by
                            providing your client with a hands-on experience;</li>
                        <li><strong>Communicating your vision</strong>. By using an interactive medium to preview and test
                            design elements, designers and developers can understand each other — and the project — better.
                        </li>
                    </ol>
                    <h3>Laying the groundwork for best design</h3>
                    <p>Before going digital, you might benefit from scribbling down some ideas in a sketchbook. This way,
                        you can think things through before committing to an actual design project.</p>
                    <p>Let's start by including the CSS file inside the <code>head</code> tag of your HTML.</p>
                    <h3>Understanding typography</h3>
                    <h4>Type properties</h4>
                    <p>A typeface is a collection of letters. While each letter is unique, certain shapes are shared across
                        letters. A typeface represents shared patterns across a collection of letters.</p>
                    <h4>Baseline</h4>
           
                    <img src="https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png" alt="" />
                    <ol>
                        <li>Low contrast between thick and thin strokes</li>
                        <li>Diagonal stress in the strokes</li>
                        <li>Slanted serifs on lower-case ascenders</li>
                    </ol>
        



                </article>
               <MainSidebar />
            </div>
        </main>
    )
}


export default MainSection