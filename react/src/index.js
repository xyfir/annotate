import 'styles.scss';

import ViewAnnotations from './ViewAnnotations';
import AnnotateCore from 'repo/core';
import Document from './types/Document';
import Search from './types/Search';
import Image from './types/Image';
import Video from './types/Video';
import Audio from './types/Audio';
import Link from './types/Link';
import Map from './types/Map';

export default Object.assign({}, AnnotateCore, {
  ViewAnnotations,
  Document,
  Search,
  Image,
  Video,
  Link,
  Map
});
