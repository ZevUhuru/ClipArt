import React from "react";
import Link from "next/link";

const articles = [
    {
        title: "How to Generate Royalty Free Christmas Clip Art Using Ai",
        image: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "2 minutes",
        url: "/learn/how-to-generate-royalty-free-christmas-clip-art-using-ai"
    },
    {
        title: "How to Generate Royalty Free Flowers Clip Art Using Ai",
        image: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes",
        url: "/learn/how-to-generate-royalty-free-christmas-clip-art-using-ai"
    },
    {
        title: "We partnered up with Google",
        image: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "8 minutes",
        url: "/learn/how-to-generate-royalty-free-christmas-clip-art-using-ai"
    },
    {
        title: "Our first project with React",
        image: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png",
        description: "Over the past year, Volosoft has undergone many changes! After months of preparation.",
        readTime: "12 minutes",
        url: "/learn/how-to-generate-royalty-free-christmas-clip-art-using-ai"
    }
];

const BlogLayout = () => {
    return (
<div className="max-w-screen-xl mx-auto">
            <div className="dark:bg-gray-900 flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-5 xl:pt-[100px]">
                {articles.map((article, index) => (
                    <article key={index} className="h-full rounded-xl dark:border-gray-600 flex flex-col items-center sm:items-start">
                        <Link href={article.url} className="h-full mb-2 xl:mb-0">
                            <img src={article.image} className="w-full h-full object-cover object-center mr-5" alt={`Image ${index + 1}`} />
                        </Link>
                        <div className="h-full flex flex-col justify-center items-center sm:items-start">
                            <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white">
                                <a href="#">{article.title}</a>
                            </h2>
                            <p className="mb-4 text-gray-500 dark:text-gray-400 max-w-sm">{article.description}</p>
                            <Link href={article.url} className="inline-flex items-center font-medium underline underline-offset-4 text-primary-600 dark:text-primary-500 hover:no-underline">
                                Read in {article.readTime}
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}

export default BlogLayout;