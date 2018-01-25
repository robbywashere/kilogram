import React from 'react';
import { List, Datagrid, TextField, BooleanField, DateField } from 'admin-on-rest';

export const UserList = (props) => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="email"/>
    </Datagrid>
  </List>
);
