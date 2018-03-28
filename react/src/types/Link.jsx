import { Button } from 'react-md';
import React from 'react';

export default ({ annotation }) => (
  <div className='link-annotation'>
    <Button
      floating fixed secondary
      tooltipPosition='right'
      fixedPosition='bl'
      tooltipLabel='Go to source'
      iconChildren='link'
      onClick={() => window.open(annotation.value)}
    />

    <iframe src={annotation.value} />
  </div>
);