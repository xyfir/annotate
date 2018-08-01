import { generateWebSearchContext } from '@xyfir/annotate-core';
import { Button } from 'react-md';
import React from 'react';

export default class WebSearchAnnotation extends React.Component {
  constructor(props) {
    super(props);

    this.state = { useContext: false };
  }

  render() {
    const { annotation, book } = this.props;
    const { useContext } = this.state;
    const contextValue =
      book && !annotation.context
        ? generateWebSearchContext(book.title, book.authors)
        : annotation.context;

    return (
      <div className="web-search-annotation">
        {contextValue ? (
          <Button
            floating
            fixed
            secondary
            tooltipPosition="right"
            fixedPosition="bl"
            tooltipLabel={(useContext ? 'Remove' : 'Add') + ' context'}
            iconChildren="search"
            onClick={() => this.setState({ useContext: !useContext })}
          />
        ) : null}

        <iframe
          src={
            '//www.bing.com/search?q=' +
            (useContext ? contextValue + ' ' : '') +
            annotation.value
          }
          className="search"
        />
      </div>
    );
  }
}
