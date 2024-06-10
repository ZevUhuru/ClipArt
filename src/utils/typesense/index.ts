// index.ts
import Typesense from 'typesense';

const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.NEXT_PUBLIC_TYPESENSE_HOST as string,
    port: 443,
    protocol: 'https',
  }],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY as string,
  connectionTimeoutSeconds: 5,
});

export default typesense;
