import { Button } from 'react-md';
import React from 'react';

export default ({ link }) => (
  <div className='video-annotation'>{
    link.indexOf('youtube.com/') > -1 ? (
      <iframe src={link} className='youtube' />
    ) : link.indexOf('vimeo.com/') > -1 ? (
      <iframe src={link} className='vimeo' />
    ) : (
      <div className='normal'>
        <Button
          floating fixed secondary
          tooltipPosition='right'
          fixedPosition='bl'
          tooltipLabel='Go to source'
          iconChildren='link'
          onClick={() => window.open(link)}
        />

        <video src={link} controls />
      </div>
    )
  }</div>
);