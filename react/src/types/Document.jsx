import marked from 'marked';
import React from 'react';

export default class DocumentAnnotation extends React.Component {
  constructor(props) {
    super(props);
  }

  /** @param {MouseEvent} e */
  onClick(e) {
    const { onGoToLink } = this.props;

    if (e.target.nodeName != 'A') return;
    e.preventDefault();
    onGoToLink(e.target.href);
  }

  render() {
    const { annotation } = this.props;

    return (
      <div
        onClick={e => this.onClick(e)}
        className="document-annotation markdown-body"
        dangerouslySetInnerHTML={{
          __html: marked(annotation.value, { sanitize: true })
        }}
      />
    );
  }
}
