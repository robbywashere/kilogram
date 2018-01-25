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
import authClient from './authClient';

const http = (u, o = {}) => fetchJson(u, { ...o, credentials: 'include' });

const App = () => (
  <Admin restClient={epilogueClient(window.location.origin, http )} authClient={authClient} >
        <Resource name="devices" list={DeviceList} />
        <Resource name="jobs" list={JobList} />
        <Resource name="accounts"  list={AccountList} />
        <Resource name="users" list={UserList} />
        <Resource name="photos" list={PhotoList} />
        <Resource name="bucketevents" list={BucketEventList} />
    </Admin>
);

export default App;
