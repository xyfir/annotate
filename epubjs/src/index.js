import insertAnnotations from './insert';
import unwrapMatches from './unwrap';
import annotateHTML from 'repo/html';
import findMarkers from './find-markers';

export default {
  ...annotateHTML,
  insertAnnotations,
  unwrapMatches,
  findMarkers
};