#iago

encode ogg in the browser

- something odd about ScriptProcessorNode in chrome right now, but firefox is working fine.

###Credit where credit is due

- Thanks to halfvector for the initial work on this:
  - http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/
  - https://gist.github.com/halfvector/9105335
- Thanks to devongovett for the ogg.js repo
  - https://github.com/devongovett/ogg.js
- Thanks to shovon for moving ogg.js forward and improved documentation
  - https://github.com/shovon/libvorbis.js

###Usage

```javascript
var iago = new Iago();

// PCM stream issuing AudioProcessingEvents
stream.connect( iago.input );

// Do your stream thing

// Get your compressed ogg
var b = stream.getBlob();
```
