import React from 'react';


const BlogHero = () => {
    return (
        <section className="bg-white dark:bg-gray-900 pt-[100px] lg:pt-0">
    <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-12 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7 xl:col-span-8">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">Learn</h1>
            <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Stay ahead of the curve with super simple tutorials on how to generate and customize your own Ai art each week.</p>
            <form action="#" className="">
                <div className="flex items-center mb-3">
                    <div className="relative w-auto mr-3">
                        <label htmlFor="member_email" className="hidden mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Email address</label>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                        </div>
                        <input className="block md:w-96 w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Enter your email" type="email" name="member[email]" id="member_email" required={true} />
                    </div>
                    <div>
                        <input type="submit" value="Get Newsletter" className="px-5 py-3 text-sm font-medium text-center text-white rounded-lg cursor-pointer bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" name="member_submit" id="member_submit" />
                    </div>
                </div>
                {/* <div className="text-sm text-left text-gray-500 dark:text-gray-300">Instant signup. No credit card required. <a href="#" className="text-primary-600 hover:underline dark:text-primary-500">Terms of Service</a> and <a className="text-primary-600 hover:underline dark:text-primary-500" href="#">Privacy Policy</a>.</div> */}
            </form>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 xl:col-span-4 lg:flex">
            <img src="https://assets.codepen.io/9394943/learn-creative-clip-art.png" alt="phone illustration" />
        </div>                
    </div>
</section>)
}


export default BlogHero;