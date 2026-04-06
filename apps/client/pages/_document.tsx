import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="description" content="Buzz - A social media platform to share what's happening" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
