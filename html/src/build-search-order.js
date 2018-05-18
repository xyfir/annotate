/**
 * @typedef {object} AnnotationSearchOrderItem
 * @prop {number} item - The index of the item within the annotation set's
 * `items` array.
 * @prop {number} search - The index of the search within the annotation
 * set's item's `searches` array.
 */
/**
 * Builds the order in which an annotation set's item searches are ran against
 * the book's HTML and ensures that the longest searches are ran first.
 * @param {object[]} items - An object array of an annotation set's items.
 * @return {AnnotationSearchOrderItem[]}
 */
export default function(items) {
  const order = [];

  items.forEach((item, itemIndex) =>
    item.searches.forEach((search, searchIndex) =>
      order.push(
        typeof search == 'string'
          ? {
              length: search.length,
              search: searchIndex,
              before: false,
              after: false,
              item: itemIndex
            }
          : {
              length: search.main.length,
              search: searchIndex,
              before: !!search.before,
              after: !!search.after,
              item: itemIndex
            }
      )
    )
  );

  return (
    order
      // Both specific and global searches are sorted by `main` length, but
      // specific searches come first
      .sort((a, b) => {
        if (!(a.before || a.after) && (b.before || b.after)) return -1;
        else if ((a.before || a.after) && !(b.before || b.after)) return 1;
        else return a.length - b.length;
      })
      .map(o => ({ item: o.item, search: o.search }))
      .reverse()
  );
}
