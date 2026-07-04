// Thin re-export — all logic lives in src/services/api/ (transport + domain files).
// Screens import `api` from here during migration; once all screens use hooks the
// direct api.* calls disappear and this file can be removed.
export { default } from './api/index';
