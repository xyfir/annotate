import { ListItem, List } from 'react-md';
import React from 'react';

/**
 * @typedef {object} ItemPickerProps
 * @prop {function} onPick
 * @prop {object[]} items
 */
/** @param {ItemPickerProps} props */
const ItemPicker = props => (
  <List className="xyfir-annotate-react item-picker">
    {props.items.map(item => (
      <ListItem
        key={item.id}
        onClick={() => props.onPick(item)}
        primaryText={
          item.title || typeof item.searches[0] == 'object'
            ? item.searches[0].main
            : item.searches[0]
        }
        secondaryText={`${item.annotations.length} annotation(s); ${
          item.searches.length
        } search(es)`}
      />
    ))}
  </List>
);

export default ItemPicker;
