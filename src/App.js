// in src/App.js
import React from 'react';
import { Admin, Resource } from 'admin-on-rest';
import { fetchJson } from 'admin-on-rest/lib/util/fetch';

import epilogueClient from 'aor-epilogue-client';
import { DeviceList } from './devices';
import { JobList } from './jobs';
import { AccountList } from './accounts';
import { UserList } from './users';
import { PhotoList } from './photos';
import { BucketEventList } from './bucketevents';
import { sessionClient } from './authClient';

const http = (u, o = {}) => fetchJson(u, { ...o, credentials: 'include' });

const App = () => (
  <Admin restClient={epilogueClient(window.location.origin, http )} authClient={sessionClient} >
    <Resource name="admin/devices" name='Devices' list={DeviceList} />
    <Resource name="admin/jobs" name='Jobs' list={JobList} />
    <Resource name="admin/accounts"  name='Accounts' list={AccountList} />
    <Resource name="admin/users" name='Users' list={UserList} />
    <Resource name="admin/photos" name='Photos' list={PhotoList} />
    <Resource name="admin/bucketevents" name='Bucket Events' list={BucketEventList} />
  </Admin>
);

export default App;
