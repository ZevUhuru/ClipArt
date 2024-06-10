// utils/algolia.js
import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('YourApplicationID', 'YourSearchOnlyApiKey');

export default searchClient;
