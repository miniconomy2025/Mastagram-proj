import type { LanguageString } from "@fedify/fedify";

export interface FederatedUserList {
  id: string;
  handle: string;
  name: string | LanguageString ;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  items: T[] | unknown[];
  total?: number;
  next?: string;
}

export interface CollectionData<T> {
  items: T[] | unknown[];
  total?: number;
  next?: string;
}