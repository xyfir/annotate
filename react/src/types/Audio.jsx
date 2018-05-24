import React from 'react';

export default class AudioAnnotation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      soundcloud: null,
      badSource: false,
      loading: true
    };
  }

  componentDidMount() {
    const { annotation } = this.props;
    /** @type {string} */
    const id = Array.isArray(annotation.value)
      ? annotation.value[0]
      : annotation.value;

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
    const { soundcloud, badSource, loading } = this.state;
    if (loading) return null;

    return badSource ? (
      <p>Cannot load audio track from this source.</p>
    ) : (
      <div
        className="audio-annotation"
        dangerouslySetInnerHTML={{ __html: soundcloud.html }}
      />
    );
  }
}
