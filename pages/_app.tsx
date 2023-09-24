import type { AppProps } from 'next/app'
import '../styles/index.css'
// import 'flowbite/dist/css/flowbite.min.css';
// import 'flowbite/dist/js/flowbite.min.js';


export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
