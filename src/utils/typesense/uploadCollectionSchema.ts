import typesenseClient from './index'
import clipArtCollectionSchema from './collectionSchema';


// Function to upl1oad the schema
async function uploadSchema() {
  try {
    const response = await typesenseClient.collections().create(clipArtCollectionSchema);
    console.log('Schema uploaded successfully:', response);
  } catch (error) {
    console.error('Error uploading schema:', error);
  }
}

// Execute the function
uploadSchema();
