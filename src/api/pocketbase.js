import PocketBase from 'pocketbase';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8090';

export const pocketBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_POCKETBASE_URL
    ? import.meta.env.VITE_POCKETBASE_URL
    : DEFAULT_BASE_URL;

export const pb = new PocketBase(pocketBaseUrl);

export function createPocketBaseClient(baseUrl = pocketBaseUrl) {
  return new PocketBase(baseUrl);
}

export default pb;