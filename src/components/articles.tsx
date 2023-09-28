import React from 'react';

const RelatedArticles = () => {
    const articles = [
        {
            imgSrc: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-1.png",
            title: "Our first office",
            description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
            readTime: "Read in 2 minutes"
        },
        {
            imgSrc: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-2.png",
            title: "Enterprise design tips",
            description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
            readTime: "Read in 12 minutes"
        },
        {
            imgSrc: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-3.png",
            title: "We partnered up with Google",
            description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
            readTime: "Read in 8 minutes"
        },
        {
            imgSrc: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-4.png",
            title: "Our first project with React",
            description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
            readTime: "Read in 12 minutes"
        }
    ];

    return (
        <>
            <aside aria-label="Related articles" className="py-8 lg:py-24 bg-white dark:bg-gray-900">
                <div className="px-4 mx-auto max-w-screen-xl">
                    <h2 className="mb-6 lg:mb-8 text-2xl font-bold text-gray-900 dark:text-white">Related articles</h2>
                    <div className="grid gap-6 lg:gap-12 md:grid-cols-2">
                        {articles.map((article, index) => (
                            <article key={index} className="flex flex-col xl:flex-row">
                                <a href="#" className="mb-2 xl:mb-0">
                                    <img src={article.imgSrc} className="mr-5 max-w-sm" alt={`Image ${index + 1}`} />
                                </a>
                                <div className="flex flex-col justify-center">
                                    <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                        <a href="#">{article.title}</a>
                                    </h2>
                                    <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">{article.description}</p>
                                    <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                                        {article.readTime}
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </aside>

            <section className="bg-gray-50 dark:bg-gray-800">
                <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                    <div className="mx-auto max-w-screen-md sm:text-center">
                        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">Sign up for our newsletter</h2>
                        <p className="mx-auto mb-8 max-w-2xl text-gray-500 md:mb-12 sm:text-xl dark:text-gray-400">Stay up to date with the roadmap progress, announcements and exclusive discounts feel free to sign up with your email.</p>
                        <form action="#">
                            <div className="items-center mx-auto mb-3 space-y-4 max-w-screen-sm sm:flex sm:space-y-0">
                                <div className="relative w-full">
                                    <label htmlFor="email" className="hidden mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Email address</label>
                                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                        {/* SVG icon here */}
                                    </div>
                                    <input className="block p-3 pl-9 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 sm:rounded-none sm:rounded-l-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Enter your email" type="email" id="email" required />
                                </div>
                                <div>
                                    <button type="submit" className="py-3 px-6 w-full text-sm font-medium text-white bg-primary-600 rounded-lg sm:rounded-none sm:rounded-r-lg hover:bg-primary-700 focus:ring-primary-500 focus:ring-offset-2 focus:ring-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:outline-none">Subscribe</button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">We care about the protection of your data. Read our <a href="#" className="font-medium text-gray-700 underline dark:text-gray-300">Privacy Policy</a>.</p>
                        </form>
                    </div>
                </div>
            </section>

            <footer className="bg-white dark:bg-gray-900 antialiased">
                <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="mb-8 lg:mb-0">
                            <a href="#" className="flex items-center mb-4">
                                <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/footer/logo.png" alt="FlowBite" className="w-32" />
                            </a>
                            <p className="text-sm text-gray-500 dark:text-gray-400">FlowBite is a free and open-source web UI kit built with Bootstrap 5. It's packed with 100+ components, 3 example pages and 3 customized plugins.</p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-4 text-sm font-bold tracking-wide text-gray-900 uppercase dark:text-white">Products</h2>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">FlowBite</a></li>
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Volosoft</a></li>
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Joli</a></li>
                                </ul>
                            </div>
                            <div>
                                <h2 className="mb-4 text-sm font-bold tracking-wide text-gray-900 uppercase dark:text-white">Resources</h2>
                                <ul className="space-y-3">
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Documentation</a></li>
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Changelog</a></li>
                                    <li><a href="#" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Page builder</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700">
                        <div className="py-4 flex flex-col lg:flex-row justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">© 2023 FlowBite. All rights reserved.</p>
                            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                                <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    <span className="sr-only">Twitter</span>
                                    {/* SVG icon here */}
                                </a>
                                <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    <span className="sr-only">GitHub</span>
                                    {/* SVG icon here */}
                                </a>
                                <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    <span className="sr-only">Dribbble</span>
                                    {/* SVG icon here */}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default RelatedArticles;
