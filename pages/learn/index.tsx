import React from "react";

import SearchHeader from "src/components/Page/Search/searchHeader"
import Footer from "src/components/footer";
import BlogLayout from "src/components/Page/Blog/blogLayout";
import BlogHero from "src/components/Page/Blog/blogHero";
import SearchComponent from "src/components/Search";
import { useRouter } from 'next/router';


const BlogPage = () => {
    const router = useRouter();

    return (
        <div className="antialiased bg-gray-50 dark:bg-gray-900">
            <BlogHero />
            <SearchHeader  />
            <BlogLayout />
            <Footer />
        </div>
    )
   
}

export default BlogPage;