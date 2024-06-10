const schema = {
  "name": "clip_art_collection",
  "fields": [
    {
      "name": "id",
      "type": "string",
      "facet": false,
      "index": true
    },
    {
      "name": "title",
      "type": "string",
      "facet": false,
      "index": true
    },
    {
      "name": "tags",
      "type": "string",
      "facet": true,
      "index": true
    },
    {
      "name": "description",
      "type": "string",
      "facet": false,
      "index": true
    },
    {
      "name": "image_url",
      "type": "string",
      "facet": false,
      "index": false,
      "optional": true
    },
    {
      "name": "creation_timestamp",
      "type": "int32",
      "facet": false,
      "index": true
    }
  ],
  "default_sorting_field": "creation_timestamp", 
  "enable_nested_fields": true
}


export default schema;
