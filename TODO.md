
- Add { success: false }, on full_dance 'timeout'
- Tweek UI automator timeout / And-OR set another timeout which sweeps the database for jobs in progress over x amount of time - would need to free this device though, via killing potential process id? ? ? ? ? 
- Log and report failed jobs
- Add tests for all of the above
- `if (this._bridge && this._bridge.childProcess) this._bridge.childProcess.kill();` This may be have to be tracked per phone-server-node. the node may need a unique id 
- Test via disabling WIFI on device ?
- Detect network errors?
- await job.backout(err); /// Should device be left sleeping if job errors? Should there be a health check on device?
