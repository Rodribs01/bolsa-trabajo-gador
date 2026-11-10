export interface CatalogItem {
  id: number;
  type: string;
  name: string;
  parentId: number | null;
  order: number;
}
