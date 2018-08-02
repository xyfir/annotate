const package = require('package.json');

exports.NOTIFICATION_FOOTER = set => `
<footer class="xy-notification">
  <p>
    This book has been annotated via <a href="https://www.npmjs.com/package/@xyfir/annotate-cli">
      annotate-cli
    </a> version <code>
      ${package.version}
    </code> on <code>
      ${new Date().toDateString()}
    </code> using the <a href="https://annotations.xyfir.com">
      xyAnnotations
    </a> annotation set <a href="https://annotations.xyfir.com/sets/${
      set.id
    }">#${set.id}</a> version <code>
      ${set.version}
    </code>.
  </p>
  <p>
    Please see the original annotation set for license, copyright, sourcing, and other relevant information regarding the annotations and the contents they were sourced from.
  </p>
  <p>
    This content may be outdated. Check the original annotation set for the latest version.
  </p>
</footer>`;
