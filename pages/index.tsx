import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import Bridge from '../components/Icons/Bridge'
import Logo from '../components/Icons/Logo'
import Modal from '../components/Modal'
import cloudinary from '../utils/cloudinary'
import getBase64ImageUrl from '../utils/generateBlurPlaceholder'
import type { ImageProps } from '../utils/types'
import { useLastViewedPhoto } from '../utils/useLastViewedPhoto'

const Home: NextPage = ({ images }: { images: ImageProps[] }) => {
  const router = useRouter()
  const { photoId } = router.query
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto()

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: 'center' })
      setLastViewedPhoto(null)
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto])

  return (
    <>
      <Head>
        <title>Free Ai Generated Clip Art | Clip.Art</title>
        <meta
          property="og:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
        <meta
          name="twitter:image"
          content="https://nextjsconf-pics.vercel.app/og-image.png"
        />
      </Head>
      {/* <main className="mx-auto max-w-[1960px] w-full"> */}

      <main className="mx-auto w-full">
        <div className="h-screen w-full bg-white">
          <div className="header-container">

            <header className="flex justify-start h-[60px] px-50">
              <div className="logo-container max-w-[100px]">
                <img src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" alt="Logo" className="w-full h-full" />
              </div>
            </header>

            <div className="hero-container flex flex-col justify-center h-full w-full max-h-[500px] bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[600px]" style={{ backgroundImage: "url('https://assets.codepen.io/9394943/laughing-santa.png')" }}>
              <div className="hero-content ml-[50px]">
                <h1 className="text-white text-30 font-semibold font-sans text-shadow backdrop-blur-[1px] p-1 max-w-[425px]">The Largest Collection <br />of Free, Ai Generated, Clip Art</h1>
                <div className="search-container flex flex-col justify-end items-center w-full max-w-xl mt-[50px]">
                  <form className="w-full flex items-center rounded">
                    <input type="search"  placeholder="Search for free clip art" className="h-12 w-full rounded-lg text-lg p-[10px] shadow-lg hover:shadow-xl transition-shadow duration-300" />
                  </form>
                </div>
              </div>

            </div>
          </div>
          {/* <div>
        <div>
          <h2 className="font-sans">Featured</h2>
          <ul className="list-none m-0 p-0">
            <li>
              <div className="w-72 h-36 bg-black rounded-lg"></div>
            </li>
          </ul>
        </div>
      </div> */}
        </div>

      </main>
      <footer className="bg-footer-gradient" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <img className="h-7" src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" alt="Company name" />
              
              <h3 className="text-lg leading-6 text-gray-300 ">The largest collection of free, ai-generated, clip art.</h3>
              <div className="flex space-x-6">
                {/* Facebook Icon */}
                <a href="#" className="text-gray-500 hover:text-gray-400">
                  <span className="sr-only">Facebook</span>
                  {/* Add your Facebook SVG icon here */}
                </a>
                {/* Instagram Icon */}
                <a href="#" className="text-gray-500 hover:text-gray-400">
                  <span className="sr-only">Instagram</span>
                  {/* Add your Instagram SVG icon here */}
                </a>
                {/* Twitter Icon */}
                <a href="#" className="text-gray-500 hover:text-gray-400">
                  <span className="sr-only">Twitter</span>
                  {/* Add your Twitter SVG icon here */}
                </a>
                {/* GitHub Icon */}
                <a href="#" className="text-gray-500 hover:text-gray-400">
                  <span className="sr-only">GitHub</span>
                  {/* Add your GitHub SVG icon here */}
                </a>
                {/* YouTube Icon */}
                <a href="#" className="text-gray-500 hover:text-gray-400">
                  <span className="sr-only">YouTube</span>
                  {/* Add your YouTube SVG icon here */}
                </a>
              </div>
            </div>
            {/* <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Solutions</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Marketing</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Analytics</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Commerce</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Insights</a></li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Pricing</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Documentation</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Guides</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">API Status</a></li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">About</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Blog</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Jobs</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Press</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Partners</a></li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Claim</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Privacy</a></li>
                    <li><a href="#" className="text-sm leading-6 text-gray-300 hover:text-white">Terms</a></li>
                  </ul>
                </div>
              </div>
            </div> */}
          </div>
          <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
            <p className="text-xs leading-5 text-gray-400">© 2023 Clip.Art All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home

export async function getStaticProps() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by('public_id', 'desc')
    .max_results(400)
    .execute()
  let reducedResults: ImageProps[] = []

  let i = 0
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    })
    i++
  }

  const blurImagePromises = results.resources.map((image: ImageProps) => {
    return getBase64ImageUrl(image)
  })
  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises)

  for (let i = 0; i < reducedResults.length; i++) {
    reducedResults[i].blurDataUrl = imagesWithBlurDataUrls[i]
  }

  return {
    props: {
      images: reducedResults,
    },
  }
}
