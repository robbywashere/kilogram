import React from 'react';
import { List, Datagrid, TextField, BooleanField, DateField } from 'admin-on-rest';

export const JobList = (props) => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="cmd" label="Command" />
      <BooleanField source="inprog" label="In Progress" />
      <DateField source="updatedAt" label="Updated at" showTime/>
      <DateField source="createdAt" label="Created at" showTime/>
    </Datagrid>
  </List>
);
