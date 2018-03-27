import insertAnnotations from './insert';
import annotateHTML from 'repo/html';
import findMarkers from './find-markers';

export default {
  ...annotateHTML,
  insertAnnotations,
  findMarkers
};