// in src/posts.js
import React from 'react';
import get from 'lodash/get';
import { List, FunctionField, Datagrid, ImageField, TextField, BooleanField, DateField } from 'admin-on-rest';


export const PhotoList = props => (
  <List {...props}>
    <Datagrid>
      <ImageField label="image" source="url" />
    </Datagrid>
  </List>
);
