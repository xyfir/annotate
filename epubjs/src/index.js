import {
  buildSearchOrder, findMatchIndexes, wrapMatches
} from 'repo/html';
import insertAnnotations from 'annotations/insert';
import unwrapMatches from 'matches/unwrap';
import findMarkers from 'annotations/find-markers';

export default {
  insertAnnotations,
  buildSearchOrder,
  findMatchIndexes,
  unwrapMatches,
  findMarkers,
  wrapMatches
};