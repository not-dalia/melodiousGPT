For a musical composition of 30 seconds, give: mood, key, time signature, bpm, instruments (3 maximum), melody parts (main melody, chords, counter melody, bassline, etc.). Only output the result. Follow this format:

const composition = {
mood: "...",
key: "...".
timeSignature: "...",
bpm: ...,
instruments: [...],
melodyParts: [
{
  instrument: ...,
  type: "mainMelodyRightHand",
}, ...
]
}

-----------------

Provide the musical notation using the following format:
[{"t": "0:8", "n": "C5", "d": "4n"},
  {"t": "0:9", "n": "D5", "d": "4n"},
  {"t": "0:10", "n": "E5", "d": "2n"},
  {"t": "0:12", "n": "A4", "d": "4n"}, ...]

For the chords, you can use the following chord construction example:
[
  {"t": 0, "n": ["G3", "B3", "D4"], "d": "2n"},
  {"t": "0:2", "n": ["G3", "B3", "D4"], "d": "2n"}, ...]

Feel free to adjust the notes and rhythm as needed to fit your desired sound and style. Output code only. Provide the mainMelody part. It has to be 30 seconds long.

-----------------

Provide the chords part. It has to be 30 seconds long.

-----------------

Provide the bassline part. It has to be 30 seconds long.
