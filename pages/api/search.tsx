// pages/api/search.js
import { NextApiRequest, NextApiResponse } from 'next';
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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) { 


  console.log('req', req)

  if (!typesenseClient) {
    console.error("Typesense client not initialized");
    return res.status(500).json({ 
      success: false, 
      error: "Search service not properly configured" 
    });
  }

  // Check for the correct HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Validate and sanitize the query parameter
  const { q } = req.query;
  console.log('querrryrry', q)
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
    console.log('searchParameters', searchParameters)
    const COLLECTION_NAME = 'clip_art_collection';
    const searchResults = await typesenseClient.collections(COLLECTION_NAME).documents().search(searchParameters);
    console.log('searchhh', searchResults)
    // Return the search results
    return res.status(200).json({ success: true, data: searchResults.hits });
  } catch (error) {
    // Detailed error logging
    console.error("Typesense search error:", {
      message: error.message,
      stack: error.stack,
      details: error.response?.body || error
    });

    return res.status(500).json({ 
      success: false, 
      error: "Search service error: " + error.message
    });
  }
};
