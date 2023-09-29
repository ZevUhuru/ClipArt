import React from "react";  
import typesense from "src/utils/typesense"


const ResultsSection = async ({ searchQuery, filterBy = "tag:landscape", sortBy = "date:desc" }) => {
    const results = await typesense.collections('YOUR_COLLECTION_NAME').documents().search({
        q: `${searchQuery}`,
        query_by: 'title,tags,description',
        filter_by: `${filterBy}`, 
        sort_by: `${sortBy}`,
    })

      console.log(results)
      
    return (
        <div></div>
    )

}

export default ResultsSection;