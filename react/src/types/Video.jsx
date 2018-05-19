import { Button } from 'react-md';
import React from 'react';

export default ({ annotation, onGoToLink }) => {
  /** @type {string} */
  const link = Array.isArray(annotation.value)
    ? annotation.value[0]
    : annotation.value;

  return (
    <div className="video-annotation">
      {link.indexOf('youtube.com/') > -1 ? (
        <iframe src={link} className="youtube" />
      ) : link.indexOf('vimeo.com/') > -1 ? (
        <iframe src={link} className="vimeo" />
      ) : (
        <div className="normal">
          <Button
            floating
            fixed
            secondary
            tooltipPosition="right"
            fixedPosition="bl"
            tooltipLabel="Go to source"
            iconChildren="link"
            onClick={() => onGoToLink(link)}
          />

          <video src={link} controls />
        </div>
      )}
    </div>
  );
};
