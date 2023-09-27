import React from 'react'

const RelatedArticlesSection = () => {
    return (
        <aside aria-label="Related articles" className="py-8 lg:py-24 bg-white dark:bg-gray-900">
        <div className="px-4 mx-auto max-w-screen-xl">
            <h2 className="mb-6 lg:mb-8 text-2xl font-bold text-gray-900 dark:text-white">Related articles</h2>
            <div className="grid gap-6 lg:gap-12 md:grid-cols-2">
                <article className="flex flex-col xl:flex-row">
                    <a href="#" className="mb-2 xl:mb-0">
                        <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-1.png" className="mr-5 max-w-sm" alt="Image 1" />
                    </a>
                    <div className="flex flex-col justify-center">
                        <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                            <a href="#">Our first office</a>
                        </h2>
                        <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">Over the past year, Volosoft has undergone many changes! After months of preparation.</p>
                        <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                            Read in 2 minutes
                        </a>
                    </div>
                </article>
                <article className="flex flex-col xl:flex-row">
                    <a href="#" className="mb-2 xl:mb-0">
                        <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-2.png" className="mr-5 max-w-sm" alt="Image 2" />
                    </a>
                    <div className="flex flex-col justify-center">
                        <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                            <a href="#">Enterprise design tips</a>
                        </h2>
                        <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">Over the past year, Volosoft has undergone many changes! After months of preparation.</p>
                        <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                            Read in 12 minutes
                        </a>
                    </div>
                </article>
                <article className="flex flex-col xl:flex-row">
                    <a href="#" className="mb-2 xl:mb-0">
                        <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-3.png" className="mr-5 max-w-sm" alt="Image 3" />
                    </a>
                    <div className="flex flex-col justify-center">
                        <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                            <a href="#">We partnered up with Google</a>
                        </h2>
                        <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">Over the past year, Volosoft has undergone many changes! After months of preparation.</p>
                        <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                            Read in 8 minutes
                        </a>
                    </div>
                </article>
                <article className="flex flex-col xl:flex-row">
                    <a href="#" className="mb-2 xl:mb-0">
                        <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-4.png" className="mr-5 max-w-sm" alt="Image 4" />
                    </a>
                    <div className="flex flex-col justify-center">
                        <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                            <a href="#">Our first project with React</a>
                        </h2>
                        <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">Over the past year, Volosoft has undergone many changes! After months of preparation.</p>
                        <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                            Read in 12 minutes
                        </a>
                    </div>
                </article>
            </div>
        </div>
    </aside>
    )
}

export default RelatedArticlesSection