import React from 'react';
import Header from 'src/components/Page/Search/navbar';
import Main from 'src/components/Page/Blog/main';
import Sidebar from 'src/components/Page/Blog/relatedArticles';
import Footer from 'src/components/footer';
import Newsletter from 'src/components/Page/Blog/newsletter';


const BlogPage = () => {
    return (
        <>
            <Header />
            <Main />
            <Sidebar />
            <Newsletter />
            <Footer />
        </>)
}

export default BlogPage;