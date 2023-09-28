import React from "react";


const articles = [
    {
        title: "Our first office",
        image: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "2 minutes"
    },
    {
        title: "Enterprise design tips",
        image: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes"
    },
    {
        title: "We partnered up with Google",
        image: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "8 minutes"
    },
    {
        title: "Our first project with React",
        image: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes"
    }
];

const BlogLayout = () => {
    return (
        <div className="dark:bg-gray-900 flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-5 pt-[100px]">
            {articles.map((article, index) => (
                <article key={index} className="border-2 border-dashed border-gray-300 rounded-xl dark:border-gray-600 h-96 flex flex-col items-center sm:items-start xl:flex-row">
                    <a href="#" className="mb-2 xl:mb-0">
                        <img src={article.image} className="mr-5 max-w-sm" alt={`Image ${index + 1}`} />
                    </a>
                    <div className="flex flex-col justify-center items-center sm:items-start">
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
    )
}

export default BlogLayout;