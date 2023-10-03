// pages/api/search.js

import typesenseClient from 'src/utils/typesense';

/**
 * Search API Endpoint
 * 
 * This endpoint provides search functionality using Typesense.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * 
 * @returns {Object} - Returns search results or an error message.
 */
export default async (req, res) => {
  // Check for the correct HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Validate and sanitize the query parameter
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, error: "Invalid query parameter" });
  }

  // Define search parameters
  const searchParameters = {
    q,
    query_by: 'title,tags,description',
    prefix: true,
    num_typos: 2,
    per_page: 30,
  };

  try {
    // Perform the search using Typesense
    const searchResults = await typesenseClient.collections('clip_arts').documents().search(searchParameters);
    
    // Return the search results
    return res.status(200).json({ success: true, data: searchResults.hits });
  } catch (error) {
    // Log the error for debugging purposes (consider using a logging library in a real-world scenario)
    console.error("Error during search:", error.message);

    // Return the error message
    return res.status(500).json({ success: false, error: error.message });
  }
};
