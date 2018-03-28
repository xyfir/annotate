import { Button } from 'react-md';
import React from 'react';

export default class WebSearchAnnotation extends React.Component {

  constructor(props) {
    super(props);

    this.state = { context: false };
  }

  render() {
    const {annotation} = this.props;

    return (
      <div className='web-search-annotation'>
        {annotation.context ? (
          <Button
            floating fixed secondary
            tooltipPosition='right'
            fixedPosition='bl'
            tooltipLabel={(this.state.context ? 'Remove' : 'Add') + ' context'}
            iconChildren='search'
            onClick={() => this.setState({ context: !this.state.context })}
          />
        ) : null}

        <iframe
          src={
            '//www.bing.com/search?q=' +
            (this.state.context ? annotation.context + ' ' : '') +
            annotation.value
          }
          className='search'
        />
      </div>
    );
  }

}