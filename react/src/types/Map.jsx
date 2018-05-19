import { Button } from 'react-md';
import React from 'react';

export default ({ annotation, onGoToLink }) =>
  annotation.value.indexOf('http') == 0 ? (
    <div className="map-link-annotation">
      <Button
        floating
        fixed
        secondary
        tooltipPosition="right"
        fixedPosition="bl"
        tooltipLabel="Go to source"
        iconChildren="link"
        onClick={() => onGoToLink(annotation.value)}
      />

      <iframe src={annotation.value} />
    </div>
  ) : (
    <div className="map-search-annotation">
      <iframe
        src={
          'https://www.google.com/maps/embed/v1/place' +
          '?key=AIzaSyAezY_0Z_q0G_WPm-UXwkGmLBYURLLDKfE' +
          '&q=' +
          encodeURIComponent(annotation.value) +
          '&maptype=satellite'
        }
        className="google-maps"
      />
    </div>
  );
