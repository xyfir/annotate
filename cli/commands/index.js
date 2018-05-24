module.exports = {
  removeFromIgnoreList: require('./ignore-list/remove-from'),
  addToIgnoreList: require('./ignore-list/add-to'),
  resetIgnoreList: require('./ignore-list/reset'),
  generateCalibre: require('./generate/calibre'),
  showIgnoreList: require('./ignore-list/show'),
  generateLibGen: require('./generate/libgen'),
  generateWikia: require('./generate/wikia'),
  config: require('./config'),
  insert: require('./insert')
};
