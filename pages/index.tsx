import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import Bridge from 'src/components/Icons/Bridge'
import Logo from 'src/components/Icons/Logo'
import Modal from 'src/components/Modal'
import cloudinary from 'src/utils/cloudinary'
import getBase64ImageUrl from 'src/utils/generateBlurPlaceholder'
import type { ImageProps } from 'src/utils/types'
import { useLastViewedPhoto } from 'src/utils/useLastViewedPhoto'
import Header from 'src/components/header'
import FreeTrialSection from 'src/components/freeTrialSection'
import FAQSection from 'src/components/faqSection'
import ImageGallery from 'src/components/imageGallery'
import Footer from 'src/components/footer'
import SearchComponent from 'src/components/Search'


const defaultImages = [
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", aspectRatio:  '7:4' },
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", aspectRatio:  '7:4' },
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", aspectRatio:  '7:4' },
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", aspectRatio:  '7:4'},
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", aspectRatio:  '7:4'},
  { src: "https://assets.codepen.io/9394943/watermark-clipart-cat.png", },
];




const foodImages = [
  { src: "https://assets.codepen.io/9394943/pecan-pie-illustration.png" },
  { src: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg-2.png" },
  { src: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg.png" },
  { src: "https://assets.codepen.io/9394943/produce-basket-illustration-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/thanksgiving-illustration-1-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/pancake-illustration-1-white-bg.png" },
]

const christmasImages = [
  { src: "https://assets.codepen.io/9394943/sitting-santa-illustration.png" },
  { src: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png" },

  // { src: "https://assets.codepen.io/9394943/santa-house-glass-ball-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/life-like-santa-illustration-1-wbg.png" },
  // { src: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png" },
  

  { src: "https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png",  aspectRatio:  '7:4' },
  { src: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png", aspectRatio:  '7:4'},
  { src: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png", aspectRatio:  '7:4' },

]

const halloweenImages = [
  { src: "https://assets.codepen.io/9394943/witch-pencil-style-clip-art-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/african-witch-with-broomstick-white-bg.png" },

  // { src: "https://assets.codepen.io/9394943/santa-house-glass-ball-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/two-halloween-clip-art-pumpkins-white-bg.png" },
  // { src: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png" },
  

  { src: "https://assets.codepen.io/9394943/halloween-clip-art-ghost-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/halloween-clipart-voodoo-dollas-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/halloween-clipart-ghost-pumpkin-white-bg.png" },

]


const flowerImages = [
  { src: "https://assets.codepen.io/9394943/white-rose-woman-hair-flower-clipart.png" },
  { src: "https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png" },
  { src: "https://assets.codepen.io/9394943/young-girl-holding-flowers-clipart-white-bg.png" }, 
  { src: "https://assets.codepen.io/9394943/pink-rose-flower-clipart-white-bg.png" },
  { src: "https://assets.codepen.io/9394943/hawaiian-biscus-flower-clip-art.png" },
  { src: "https://assets.codepen.io/9394943/single-smiling-sunflower-emoji-flower-clipart.png" },

]

const catImages = [
  { src: "https://assets.codepen.io/9394943/two-kittens-playing-with-golf-balls-in-paint-clip-art.png" },
  { src: "https://assets.codepen.io/9394943/cute-kittens-holding-golf-clubs-clip-art.png" },
  { src: "https://assets.codepen.io/9394943/kitten-holding-dumbbell-cat-clip-art.png" },

  { src: "https://assets.codepen.io/9394943/cats-laying-in-fruit-basket-clip-art.png" },
  { src: "https://assets.codepen.io/9394943/cute-himalayan-kittens-playing-with-golf-balls-clip-art.png" },
  { src: "https://assets.codepen.io/9394943/cute-cats-cuddling-clip-art.png" },
]


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
        <title>Free Clip Art - Ai Generated with Modern Themes and Designs</title>
        <meta
          property="og:image"
          content="https://assets.codepen.io/9394943/clip-art-logo-cover.pngg"
        />
        <meta
          name="twitter:image"
          content="https://assets.codepen.io/9394943/clip-art-logo-cover.png"
        />
      </Head>

      <main className="mx-auto w-full ">
        <div className=" w-full ">
          <div className="header-container">

            {/* <Header /> */}
            <SearchComponent />
            
            <div className="hero-container flex flex-col justify-center h-full w-full max-h-[500px] bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[600px]" style={{ backgroundImage: "url('https://assets.codepen.io/9394943/laughing-santa-2.png')" }}>
              <div className="hero-content ml-[50px]">
                {/* backdrop-blur-[1px] */}
                <h1 className="text-white text-30 font-semibold font-sans text-shadow  p-1 max-w-[425px]">The Largest Collection <br />of Ai Generated Clip Art</h1>
                <div className="search-container flex flex-col justify-end items-center w-full max-w-xl mt-[50px]">
                  {/* <form className="w-full flex items-center rounded">
                    <input
                      type="search"
                      placeholder="Search for free clip art"
                      className="h-12 w-full rounded-lg text-lg p-[10px] bg-white border border-gray-300 shadow-2xl hover:shadow-3xl focus:outline-none focus:border-gray-400 focus:shadow-outline transition-shadow duration-300"
                    />
                  </form> */}


                  <form className="w-full flex items-center rounded">
                    <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                      </div>
                      <input
                        type="search"
                        id="default-search"
                        className="block w-full h-12 p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 shadow-2xl hover:shadow-3xl focus:outline-none focus:shadow-outline transition-shadow duration-300"
                        placeholder="Search for free clip art"
                        required
                      />
                      <button type="submit" className="h-[40px] top-[4px] text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                    </div>
                  </form>

                </div>
              </div>

            </div>
          </div>
        </div>
        <ImageGallery categoryTitle={"Food"} images={foodImages} />
        <FreeTrialSection />
        <ImageGallery categoryTitle={"Christmas"} images={christmasImages} />
        <FreeTrialSection />
        <ImageGallery categoryTitle={"Halloween"} images={halloweenImages} />
        <ImageGallery categoryTitle={"Flower"} images={flowerImages}/>
        <FreeTrialSection />
        <ImageGallery categoryTitle={"Cats"} images={catImages} />


        
        <FAQSection />

        <Footer />

      </main>

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
