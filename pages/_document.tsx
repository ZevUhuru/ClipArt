import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="stylesheet"
            type="text/css"
            href="https://unpkg.com/flowbite-typography@1.0.3/dist/typography.min.css"
          />
          <link rel="stylesheet" href="https://use.typekit.net/qau0npc.css"></link>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
          </link>
          <meta
            name="description"
            content="The Largest Collection of Ai Generated Clip Art"
          />
          <meta property="og:site_name" content="clip.art" />
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
