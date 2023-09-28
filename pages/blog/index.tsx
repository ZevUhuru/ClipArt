import React from "react";

import Header from "src/components/Page/Search/navbar"
import Footer from "src/components/footer";
import BlogLayout from "src/components/Page/Blog/blogLayout";
import BlogHero from "src/components/Page/Blog/blogHero";

const BlogPage = () => {
    return (
        <div className="antialiased bg-gray-50 dark:bg-gray-900">
            <BlogHero />
            <Header />
            <BlogLayout />
            <Footer />
        </div>
    )
   
}

export default BlogPage;