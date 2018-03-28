import React from 'react';

export default ({ annotation }) => (
  <div className='audio-annotation'>
    {(
      Array.isArray(annotation.value) ? annotation.value : [annotation.value]
    ).map(link =>
      <audio src={link} key={link} controls />
    )}
  </div>
);