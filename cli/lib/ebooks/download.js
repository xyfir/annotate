const DOMParser = require('xmldom').DOMParser;
const request = require('superagent');

const domParser = new DOMParser({ errorHandler: () => 1 });

/**
 * Attempt to download the ebook file as a Buffer.
 * @async
 * @param {string} md5
 * @return {undefined|Buffer}
 */
module.exports = async function(md5) {
  let url = 'http://libgen.io/ads.php?md5=' + md5,
    dl;

  try {
    // This link sometimes returns the file itself and sometimes returns a page
    // with the actual download link
    dl = await request.get(url);
  } catch (err) {
    return;
  }

  try {
    // Attempt to extract the actual download link
    url = domParser.parseFromString(dl.text).getElementsByTagName('a')[1]
      .attributes[0].value;
  } catch (err) {
    // Assume that original request returned the file itself and so now we have
    // to re-download it as a buffer
    url = url;
  }

  try {
    // Either redownload the original link as a buffer or download from
    // the download link as a buffer
    dl = await request
      .get(url)
      .buffer(true)
      .parse(request.parse['application/octet-stream']);

    return dl.body;
  } catch (err) {
    return;
  }
};
