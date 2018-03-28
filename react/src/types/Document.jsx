import marked from 'marked';
import React from 'react';

export default ({ annotation }) => (
  <div
    className='document-annotation markdown-body'
    dangerouslySetInnerHTML={{ __html:
      marked(annotation.value, {sanitize: true})
    }}
  />
);