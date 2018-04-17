/**
 * Generate `context` for Web Search annotations using book title and authors.
 * @param {string} [title]
 * @param {string} [authors]
 * @return {string}
 */
export default function(title = '', authors = '') {
  let context = '';

  // Short title, add first author
  if (title.length <= 10) context = title + ' ' + authors.split(/,|&/g)[0];
  // Long title, ignore authors and possible subtitle
  else if (title.length >= 20) context = title.split(':')[0];
  // Just the title
  else context = title;

  context = context.trim();

  // Remove 'the ' from beginning of context if search is long enough
  if (context.length >= 20 && /^the\s+/i.test(context))
    context = context.substr(4).trim();

  return context;
}
