import React from 'react';
import SearchHeader from 'src/components/Page/Search/searchHeader';
import Main from 'src/components/Page/Blog/main';
import Sidebar from 'src/components/Page/Blog/relatedArticles';
import Footer from 'src/components/footer';
import Newsletter from 'src/components/Page/Blog/newsletter';


const BlogPage = () => {
    return (
        <>
            <SearchHeader />
            <Main />
            <Sidebar />
            <Newsletter />
            <Footer />
        </>)
}

export default BlogPage;