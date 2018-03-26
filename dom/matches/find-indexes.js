/**
 * Build an array of start/end string indexes for each instance of needle in 
 * haystack.
 * @param {string} needle
 * @param {string} haystack
 * @return {Array.<number[]>} A 2D array where the first element in the 
 * second level of arrays is the starting index of needle within haystack and 
 * the second element is the ending index.
 */
export default function(needle, haystack) {

  const pattern = new RegExp(needle, 'gm'), indexes = [];
  let match;

  while (match = pattern.exec(haystack)) {
    indexes.push([match.index, pattern.lastIndex]);
  }

  return indexes;

}