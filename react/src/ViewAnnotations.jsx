import { ListItem, FontIcon, Toolbar, Button, Drawer } from 'react-md';
import React from 'react';

// Components
import Document from './types/Document';
import Search from './types/Search';
import Image from './types/Image';
import Video from './types/Video';
import Audio from './types/Audio';
import Link from './types/Link';
import Map from './types/Map';

const ANNOTATION_TYPES = {
  1: { icon: 'insert_drive_file', name: 'Document' },
  2: { icon: 'link', name: 'Link' },
  3: { icon: 'search', name: 'Search Query' },
  4: { icon: 'image', name: 'Image' },
  5: { icon: 'videocam', name: 'Video' },
  6: { icon: 'audiotrack', name: 'Audio' },
  7: { icon: 'place', name: 'Map Location' }
};

export default class ViewAnnotations extends React.Component {

  /**
   * @typedef {object} ViewAnnotationsProps
   * @prop {object[]} annotations
   */
  /** @param {ViewAnnotationsProps} props */
  constructor(props) {
    super(props);

    // This is just for JSDOC
    this.props = props;

    this.state = {
      /**
       * The `annotations` object array for an annotation set item.
       * @type {object[]}
       */
      annotations: this.props.annotations,
      /** Whether the drawer should show or not. */
      drawer: false,
      /** The index of the annotation we're viewing. */
      index: 0
    };
  }

  render() {
    const {annotations, drawer, index} = this.state;
    const annotation = annotations[index];

    const view = (() => {
      switch (annotation.type) {
        case 1: return <Document annotation={annotation} />
        case 2: return <Link annotation={annotation} />
        case 3: return <Search annotation={annotation} />
        case 4: return <Image annotation={annotation} />
        case 5: return <Video annotation={annotation} />
        case 6: return <Audio annotation={annotation} />
        case 7: return <Map annotation={annotation} />
      }
    })();

    return (
      <div className='xyfir-annotate-react view-annotations'>
        <Toolbar
          colored
          title={annotation.name}
          nav={
            <Button
              icon
              onClick={() => this.setState({ drawer: true })}
              iconChildren='menu'
            />
          }
        />

        <Drawer
          onVisibilityChange={v => this.setState({ drawer: v })}
          autoclose={true}
          navItems={
            annotations.map((a, index) =>
              <ListItem
                key={a.id}
                onClick={() => this.setState({ index })}
                leftIcon={
                  <FontIcon>{ANNOTATION_TYPES[a.type].icon}</FontIcon>
                }
                primaryText={a.name}
                secondaryText={ANNOTATION_TYPES[a.type].name}
              />
            )
          }
          visible={drawer}
          header={
            <Toolbar
              colored
              nav={
                <Button
                  icon
                  onClick={() => this.setState({ drawer: false })}
                  iconChildren='arrow_back'
                />
              }
            />
          }
          type={Drawer.DrawerTypes.TEMPORARY}
        />

        <div className='content'>{view}</div>
      </div>
    )
  }

}