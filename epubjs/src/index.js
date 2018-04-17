import insertAnnotations from './insert';
import AnnotateHTML from 'repo/html';
import findMarkers from './find-markers';

export default {
  ...AnnotateHTML,
  insertAnnotations,
  findMarkers
};
