import {
  buildSearchOrder, findMatchIndexes, wrapMatches
} from 'repo/html';
import insertAnnotations from './insert';
import unwrapMatches from './unwrap';
import findMarkers from './find-markers';

export default {
  insertAnnotations,
  buildSearchOrder,
  findMatchIndexes,
  unwrapMatches,
  findMarkers,
  wrapMatches
};