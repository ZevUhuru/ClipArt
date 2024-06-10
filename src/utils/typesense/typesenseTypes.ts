// typesenseTypes.ts
export type FieldType = 'string' | 'int32' | 'float' | 'bool' | 'geopoint' | 'string[]';

export interface CollectionFieldSchema {
  name: string;
  type: FieldType;
  facet: boolean;
  index: boolean;
  optional?: boolean;
}

export interface CollectionCreateSchema {
  name: string;
  fields: CollectionFieldSchema[];
  default_sorting_field: string;
  enable_nested_fields?: boolean;
}
