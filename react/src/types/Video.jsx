import { Button } from 'react-md';
import React from 'react';

export default class VideoAnnotations extends React.Component {
  constructor(props) {
    super(props);

    const { annotation } = this.props;

    this.state = {
      length: Array.isArray(annotation.value) ? annotation.value.length : 1,
      index: 0
    };
  }

  onNext() {
    const { index, length } = this.state;
    this.setState({ index: index == length - 1 ? 0 : index + 1 }, this._load);
  }

  render() {
    const { index, length } = this.state;
    const { annotation } = this.props;
    const ids = Array.isArray(annotation.value)
      ? annotation.value
      : [annotation.value];
    /** @type {string} */
    const id = ids[index];

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

        {length > 1 ? (
          <Button
            floating
            fixed
            secondary
            mini
            fixedPosition="br"
            iconChildren="navigate_next"
            onClick={() => this.onNext()}
          />
        ) : null}
      </div>
    );
  }
}
