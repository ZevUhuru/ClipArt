const Typesense = require('typesense');

const typesense = new Typesense.Client({
  nodes: [{
    host: `${process.env.TYPESENSE_HOST}}`,
    port: `${process.env.TYPESENSE_PORT}`,
    protocol: `${process.env.TYPESENSE_PROTOCOL}`,
  }],
  apiKey: `${process.env.TYPESENSE_API_KEY}`,
  connectionTimeoutSeconds: 2,
});

export default typesense;
