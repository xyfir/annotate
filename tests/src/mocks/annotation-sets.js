/**
 * In reality, you probably wouldn't have multiple sets each containing a
 *  single item, but for our purposes it makes testing more accurate. Only the
 *  `id` and `items` properties (and some others not shown here) would be
 *  expected in an actual annotation set.
 */
export default [{
  id: 1,
  items: [{
    id: 1, title: 'Benjamin Franklin',
    searches: [
      {main: 'Benjamin Franklin'},
      {main: 'Franklin'},
      {main: 'FRANKLIN'}
    ],
    annotations: [{
      type: 3, name: 'Search', value: 'Benjamin Franklin',
      context: 'Autobiography'
    }]
  }],
  elements: 77,
  matches: [
    'Benjamin Franklin',
    'Franklin',
    'FRANKLIN'
  ]
}]