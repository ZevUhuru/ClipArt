// pages/api/search.js

import typesenseClient from 'src/utils/typesense';

export default async (req, res) => {
  if (req.method === 'GET') {
    const { q } = req.query;

    const searchParameters = {
      q,
      query_by: 'title,tags,description',
      prefix: true,
      num_typos: 2,
      per_page: 30,
    };

    try {
      const searchResults = await typesenseClient.collections('clip_arts').documents().search(searchParameters);
      res.status(200).json(searchResults.hits);
    } catch (error) {
      res.status(500).json({ error: "Error during search" });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};
