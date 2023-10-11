import React from 'react'
import type { AppProps } from 'next/app'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query';
import store from 'src/redux/store'
import { useRouter } from 'next/router'
import GoogleAnalytics from 'src/components/googleAnalytics';
import { pageview } from 'src/utils/gtag'

import 'src/styles/index.css'


const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const ga_id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || ''

  
  React.useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageview(url)
    }


    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])


  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        {ga_id && <GoogleAnalytics ga_id={ga_id} />}  {/* Render GoogleAnalytics component */}
        <Component {...pageProps} />
      </Provider>
    </QueryClientProvider>
  )}
