// in src/posts.js
import React from 'react';
import get from 'lodash/get';
import { List, FunctionField, Datagrid, ImageField, TextField, BooleanField, DateField } from 'admin-on-rest';

const RenderImage = ({ value }) => {
  const Record = value.Records[0];
  const endpoint = get(Record, 'responseElements.x-minio-origin-endpoint');
  const bucket = get(Record, 's3.bucket.name');
  const name = get(Record, 's3.object.key');
  const fullpath = `${endpoint}/${bucket}/${name}`;
  return (<img src={fullpath} style={{ maxWidth: '100px', maxHeight: '150px' }} />);
};

export const BucketEventList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="key" />
      <TextField source="value.Records[0].eventName" label="Event Name" />
      <FunctionField label="image" render={RenderImage} />
    </Datagrid>
  </List>
);
