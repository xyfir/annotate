import React from 'react';

export default ({ annotation }) => (
  <div className='image-annotation'>
    {(
      Array.isArray(annotation.value) ? annotation.value : [annotation.value]
    ).map(img =>
      <a href={img} key={img} target='_blank'><img src={img} /></a>
    )}
  </div>
);