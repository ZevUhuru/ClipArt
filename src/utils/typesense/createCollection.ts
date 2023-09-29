import typesense from './index';
import clipArtCollectionSchema from './collectionSchema';



const createClipArtCollection = async () => {
  try {
    await typesense.collections().create(clipArtCollectionSchema);
    console.log("Collection created successfully.");
  } catch (error) {
    console.error("Error creating collection:", error);
  }
};

export default createClipArtCollection;
