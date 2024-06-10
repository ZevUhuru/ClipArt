// pages/image/[id].tsx

import { useRouter } from 'next/router'
import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'

interface ImagePageProps {
  imageUrl: string
}

const ImagePage: React.FC<ImagePageProps> = ({ imageUrl }) => {
  const router = useRouter()
  const { id } = router.query

  return (
    <div>
      <h1>Image {id}</h1>
      <Image src={imageUrl} alt={`Image ${id}`} width={600} height={400} />
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths dynamically
  const paths = [{ params: { id: '1' } }, { params: { id: '2' } }] // Example paths
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params!
  const imageUrl = `https://example.com/images/${id}.jpg` // Example image URL
  return { props: { imageUrl } }
}

export default ImagePage