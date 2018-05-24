import { Button } from 'react-md';
import React from 'react';

export default class AudioAnnotation extends React.Component {
  constructor(props) {
    super(props);

    const { annotation } = this.props;

    this.state = {
      soundcloud: null,
      badSource: false,
      loading: true,
      length: Array.isArray(annotation.value) ? annotation.value.length : 1,
      index: 0
    };
  }

  componentDidMount() {
    this._load();
  }

  onNext() {
    const { index, length } = this.state;
    this.setState({ index: index == length - 1 ? 0 : index + 1 }, this._load);
  }

  _load() {
    const { annotation } = this.props;
    const ids = Array.isArray(annotation.value)
      ? annotation.value
      : [annotation.value];
    /** @type {string} */
    const id = ids[this.state.index];

    switch (annotation.source) {
      case 'soundcloud':
        fetch(
          `https://soundcloud.com/oembed` +
            `?format=json` +
            `&url=https://soundcloud.com/${id}`
        )
          .then(res => res.json())
          .then(res => this.setState({ soundcloud: res, loading: false }));
        break;
      default:
        this.setState({ badSource: true, loading: false });
    }
  }

  render() {
    const { soundcloud, badSource, loading, length } = this.state;
    if (loading) return null;

    return badSource ? (
      <p>Cannot load audio track from this source.</p>
    ) : (
      <React.Fragment>
        <div
          className="audio-annotation"
          dangerouslySetInnerHTML={{ __html: soundcloud.html }}
        />

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
      </React.Fragment>
    );
  }
}
