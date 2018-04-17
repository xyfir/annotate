import insertAnnotations from './insert';
import buildSearchOrder from './build-search-order';
import findMatchIndexes from './find-indexes';
import AnnotateCore from 'repo/core';
import findMarkers from './find-markers';
import wrapMatches from './wrap';

export default Object.assign({}, AnnotateCore, {
  insertAnnotations,
  buildSearchOrder,
  findMatchIndexes,
  findMarkers,
  wrapMatches
});
