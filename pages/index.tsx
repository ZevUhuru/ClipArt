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
import HeroSection from 'src/components/Page/Home/hero'

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
            <HeroSection />

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
