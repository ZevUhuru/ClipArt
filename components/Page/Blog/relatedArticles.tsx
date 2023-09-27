import React from 'react'


const articles = [
    {
        title: "Our first office",
        image: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-1.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "2 minutes"
    },
    {
        title: "Enterprise design tips",
        image: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-2.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes"
    },
    {
        title: "We partnered up with Google",
        image: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-3.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "8 minutes"
    },
    {
        title: "Our first project with React",
        image: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/article/blog-4.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes"
    }
];
    

const RelatedArticlesSection = () => {
    return (
        <aside aria-label="Related articles" className="py-8 lg:py-24 bg-white dark:bg-gray-900">
            <div className="px-4 mx-auto max-w-screen-xl">
                <h2 className="mb-6 lg:mb-8 text-2xl font-bold text-gray-900 dark:text-white">Related articles</h2>
                <div className="grid gap-6 lg:gap-12 md:grid-cols-2">
                    {articles.map((article, index) => (
                        <article key={index} className="flex flex-col xl:flex-row">
                            <a href="#" className="mb-2 xl:mb-0">
                                <img src={article.image} className="mr-5 max-w-sm" alt={`Image ${index + 1}`} />
                            </a>
                            <div className="flex flex-col justify-center">
                                <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                    <a href="#">{article.title}</a>
                                </h2>
                                <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">{article.description}</p>
                                <a href="#" className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                                    Read in {article.readTime}
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default RelatedArticlesSection;
