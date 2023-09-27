import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="The Largest Collection of Ai Generated Clip Art"
          />
          <meta property="og:site_name" content="nextjsconf-pics.vercel.app" />
          <meta
            property="og:description"
            content="The Largest Collection of Ai Generated Clip Art"
          />
          <meta property="og:title" content="Clip.Art" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Clip.Art" />
          <meta
            name="twitter:description"
            content="The Largest Collection of Ai Generated Clip Art"
          />
        </Head>
        <body className="bg-black antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
