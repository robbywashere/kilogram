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

const prefix = 'admin';
const location = `${window.location.origin}/${prefix}`;

const App = () => (
  <Admin restClient={epilogueClient(location, http )} authClient={sessionClient} >
    <Resource name="devices" label='Devices' list={DeviceList} />
    <Resource name="jobs" label='Jobs' list={JobList} />
    <Resource name="accounts"  label='Accounts' list={AccountList} />
    <Resource name="users" label='Users' list={UserList} />
    <Resource name="photos" label='Photos' list={PhotoList} />
    <Resource name="bucketevents" label='Bucket Events' list={BucketEventList} />
  </Admin>
);

export default App;
