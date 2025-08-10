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

export interface FederatedUser {
  id: string,
  handle: string,
  name: string,
  bio: string,
  avatarUrl?: string,
  splashUrl?: string,
  followers: number;
  following: number;
  // iso 8601 date time
  createdAt?: string,
  followersUri?: string;  
  followingUri?: string;
};