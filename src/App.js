// in src/App.js
import React from 'react';
import { Admin, Resource } from 'admin-on-rest';
import { fetchJson } from 'admin-on-rest/lib/util/fetch';

import epilogueClient from 'aor-epilogue-client';
import { DeviceList } from './devices';
import { JobList } from './jobs';

const App = () => (
    <Admin restClient={epilogueClient('http://127.0.0.1:3000', fetchJson )}>
        <Resource name="devices" list={DeviceList} />
        <Resource name="jobs" list={JobList} />
    </Admin>
);

export default App;
