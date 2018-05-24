import React from 'react';

export default ({ annotation }) => {
  /** @type {string} */
  const id = Array.isArray(annotation.value)
    ? annotation.value[0]
    : annotation.value;

  return (
    <div className="video-annotation">
      {annotation.source == 'youtube' ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="youtube"
        />
      ) : annotation.source == 'vimeo' ? (
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          className="vimeo"
        />
      ) : (
        <p>Cannot play videos from this source.</p>
      )}
    </div>
  );
};
