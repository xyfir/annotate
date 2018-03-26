/**
 * @typedef {object} MatchIndex
 * @prop {number} start
 * @prop {number} end
 */
/**
 * Find start/end indexes for each match of needle in haystack.
 * @param {RegExp} needle - The regular express to search `haystack`. The
 *  regular expression *must* have the `g` flag!
 * @param {string} haystack
 * @return {MatchIndex[]}
 */
export default function(needle, haystack) {

  const matches = [];
  let match;

  while (match = needle.exec(haystack)) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return matches;

}