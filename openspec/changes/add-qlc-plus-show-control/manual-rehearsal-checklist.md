# QLC+ Manual Rehearsal Checklist

- [ ] Open **Settings -> QLC+** and set endpoint, auth mode, and timeout.
- [ ] Click **Test QLC+ Connection** and confirm healthy status message.
- [ ] Open the **QLC+ Cues** browser and verify functions list is loaded.
- [ ] Trigger **Start** and **Stop** on a function and confirm execution in QLC+.
- [ ] If function supports parameter, adjust slider and click **Apply Parameter**.
- [ ] Drag a QLC+ function from browser to a timeline track.
- [ ] Start timeline playback and verify cue fires at scheduled timestamp.
- [ ] Stop playback with `stop-run-cues` policy and confirm active cues are stopped.
- [ ] Switch policy to `panic`, replay timeline, then stop and verify panic command is sent.
