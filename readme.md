#iago

Module for encoding Ogg in the browser. 

- Stream to the encoder--your compressed audio is ready when the recording is finished
- Uses a web worker for the actual compression; UI thread is free

###Credit

- Thanks to halfvector for the heavy work on this:
  - http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/
  - https://gist.github.com/halfvector/9105335
- Thanks to devongovett for the ogg.js repo
  - https://github.com/devongovett/ogg.js
- Thanks to shovon for moving ogg.js forward and improved documentation
  - https://github.com/shovon/libvorbis.js

###Usage

Install the component:
```bash
npm install iago
```

Use it:
```javascript
var Iago = require('iago');

var context = new AudioContext();
var iago;
navigator.getUserMedia({ audio: true }, function(handle) {
  var stream = context.createMediaStreamSource(handle);
  iago = new Iago(stream);
});

// When finished:
iago.getBlob().then(function(blob) {
  // blob is of type audio/ogg
});
```
