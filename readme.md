#iago

encode ogg in the browser

###Credit where credit is due

- Thanks to halfvector for the initial work on this:
  - http://hotcashew.com/2014/02/chrome-audio-api-and-ogg-vorbis/
  - https://gist.github.com/halfvector/9105335
- Thanks to devongovett for the ogg.js repo
  - https://github.com/devongovett/ogg.js
- Thanks to shovon for moving ogg.js forward and improved documentation
  - https://github.com/shovon/libvorbis.js

```javascript
var iago = new Iago();
stream.connect( iago.input );
// Do your stream thing
var b = stream.getBlob();

```
