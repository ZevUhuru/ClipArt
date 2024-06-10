import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Carousel from 'src/components/Carousel'
import getResults from 'src/utils/cachedImages'
import cloudinary from 'src/utils/cloudinary'
import getBase64ImageUrl from 'src/utils/generateBlurPlaceholder'
import type { ImageProps } from 'src/utils/types'
import { GetStaticPropsContext } from 'next'; 
import { GetStaticPaths } from 'next';

const Home: NextPage = ({ currentPhoto }: { currentPhoto: ImageProps }) => {
  const router = useRouter()
  const { photoId } = router.query
  let index = Number(photoId)

  const currentPhotoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_2560/${currentPhoto.public_id}.${currentPhoto.format}`

  return (
    <>
      <Head>
        <title>Clip.Art | The Larget Collection of Ai Generated Clip Art</title>
        <meta property="og:image" content={currentPhotoUrl} />
        <meta name="twitter:image" content={currentPhotoUrl} />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel currentPhoto={currentPhoto} index={index} />
      </main>
    </>
  )
}

export default Home


export async function getStaticProps(context: GetStaticPropsContext) {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by('public_id', 'desc')
    .max_results(400)
    .execute();

  let reducedResults: ImageProps[] = [];
  let i = 0;
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    });
    i++;
  }

  // Check if context.params.photoId exists and is of type string
  const photoId = context.params?.photoId;
  if (typeof photoId !== 'string') {
    return {
      notFound: true,
    };
  }

  const currentPhoto = reducedResults.find(
    (img) => img.id === Number(photoId)
  );

  if (currentPhoto) {
    currentPhoto.blurDataUrl = await getBase64ImageUrl(currentPhoto);
  }

  return {
    props: {
      image: currentPhoto || null,
    },
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by('public_id', 'desc')
    .max_results(400)
    .execute();

  let fullPaths: { params: { photoId: string } }[] = [];
  for (let i = 0; i < results.resources.length; i++) {
    fullPaths.push({ params: { photoId: i.toString() } });
  }

  return {
    paths: fullPaths,
    fallback: false,
  };
};