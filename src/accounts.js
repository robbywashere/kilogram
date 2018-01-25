// in src/posts.js
import React from 'react';
import { List, Datagrid, TextField, BooleanField, DateField } from 'admin-on-rest';

export const AccountList = (props) => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="users" />
      <TextField source="name" />
      <DateField source="updatedAt" label="Updated at" showTime/>
      <DateField source="createdAt" label="Created at" showTime/>
    </Datagrid>
  </List>
);
