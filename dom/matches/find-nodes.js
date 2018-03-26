/**
 * @typedef {object} NodeMatch
 * @prop {Node} node
 * @prop {number} start - The starting index within the Node's text of the
 *  match for the search.
 * @prop {number} end - The ending index within the Node's text of the match
 *  for the search.
 */
/**
 * Recursively calls itself to find the deepest possible nodes whose
 *  `innerText` property matches the search.
 * @param {Node} node
 * @param {RegExp} search
 * @return {NodeMatch[]}
*/
function findMatchingNodes(node, search) {
  // Get start/end index for all matches within Node's text
  let matches = [], match;
  while (match = search.exec(node.innerHTML)) {
    matches.push({
      node, start: match.index, end: match.index + match[0].length
    });
  }

  // Neither this node, nor its children match the search
  if (!matches.length) return [];

  // Find matches in children
  let childMatches = [];
  for (let child of node.childNodes) {
    childMatches = childMatches.concat(findMatchingNodes(child, search));
  }

  // Ignore parent matches if children contain the same matches
  return childMatches.length ? childMatches : matches;
}

export default findMatchingNodes;