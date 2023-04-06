// const AMinorScale = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
let instruments;

const addOctaveNumbers = (scale, octaveNumber) => scale.map(note => {
  const firstOctaveNoteIndex = scale.indexOf('C') !== -1 ? scale.indexOf('C') : scale.indexOf('C#')
  const noteOctaveNumber = scale.indexOf(note) < firstOctaveNoteIndex ? octaveNumber - 1 : octaveNumber;
  return `${note}${noteOctaveNumber}`
});

const constructMajorChord = (scale, octave, rootNote) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof (scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 7];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0, 1)}${updatedOctave}`;
    }

    return nextNote;
  }

  const thirdNote = getNextChordNote(rootNote, 3)
  const fifthNote = getNextChordNote(rootNote, 5)
  const chord = [rootNote, thirdNote, fifthNote]

  return chord
}

const constructMinorChord = (scale, octave, rootNote) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof (scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 7];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0, 1)}${updatedOctave}`;
    }

    return nextNote;
  }

  const minorThirdNote = getNextChordNote(rootNote, 3)
  const fifthNote = getNextChordNote(rootNote, 5)
  const chord = [rootNote, minorThirdNote, fifthNote]

  return chord
}

const constructDiminishedChord = (scale, octave, rootNote) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof (scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 7];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0, 1)}${updatedOctave}`;
    }

    return nextNote;
  }

  const minorThirdNote = getNextChordNote(rootNote, 3)
  const diminishedFifthNote = getNextChordNote(rootNote, 6)
  const chord = [rootNote, minorThirdNote, diminishedFifthNote]

  return chord
}

const constructChords = (scale, octave) => {
  const scaleWithOctave = addOctaveNumbers(scale, octave);

  const getNextChordNote = (note, nextNoteNumber) => {
    const nextNoteInScaleIndex = scaleWithOctave.indexOf(note) + nextNoteNumber - 1;
    let nextNote;
    if (typeof (scaleWithOctave[nextNoteInScaleIndex]) !== 'undefined') {
      nextNote = scaleWithOctave[nextNoteInScaleIndex];
    } else {
      nextNote = scaleWithOctave[nextNoteInScaleIndex - 6];
      const updatedOctave = parseInt(nextNote.slice(1)) + 1;
      nextNote = `${nextNote.slice(0, 1)}${updatedOctave}`;
    }

    return nextNote;
  }


  const chordArray = scaleWithOctave.map(note => {
    let thirdNote = getNextChordNote(note, 3)
    let fifthNote = getNextChordNote(note, 5)

    const chord = [note, thirdNote, fifthNote]

    return chord
  })

  return chordArray;
}

const gptFormatToToneFormat = (gptMelody) => {
  return gptMelody.map(note => ({
    time: note.t,
    note: note.n,
    duration: note.d
  }))
}

const resetTone = async () => {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;
  await Tone.context.close();
  Tone.Buffer.off('load');
  Tone.context = new AudioContext();
}

const loadInstruments = (instrumentNames, callback) => {
  instruments = SampleLibrary.load({
    instruments: instrumentNames
  });
  Tone.Buffer.on('load', () => {
    console.log('loaded');
    for (const instrument in instruments) {
      instruments[instrument].toMaster();
    }
    callback();
  });
}

const setBpm = (bpm) => {
  Tone.Transport.bpm.value = bpm;
}

const prepareMelody = (melody, instrument) => {
  const melodyTone = gptFormatToToneFormat(melody);
  const melodyPart = new Tone.Part((time, value) => {
    instruments[instrument].triggerAttackRelease(value.note, value.duration, time);
  }, melodyTone).start(0);
  return melodyPart;
}

const prepareComposition = async (composition, melodyParts) => {
  document.getElementById("play-button").disabled = true;
  await resetTone();
  const { instruments, bpm } = composition;
  setBpm(bpm);
  loadInstruments(instruments, () => {
    melodyParts.forEach(melodyPart => prepareMelody(melodyPart.melody, melodyPart.instrument));
    console.log('parts prepared')
    document.getElementById("play-button").disabled = false;
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
    }
  });
}

/* Tone.Transport.bpm.value = 100

var mainMelodyInstrument = SampleLibrary.load({
  instruments: "violin"
});

var chordsInstrument = SampleLibrary.load({
  instruments: "piano"
});

var basslineInstrument = SampleLibrary.load({
  instruments: "cello"
});

mainMelodyInstrument.toMaster();
chordsInstrument.toMaster();
basslineInstrument.toMaster();

basslineInstrument.volume.value = -5;
chordsInstrument.volume.value = -5;

const mainMelody = gptFormatToToneFormat([{'t': '0:0', 'n': 'E5', 'd': '8n'},
{'t': '0:1', 'n': 'D5', 'd': '8n'},
{'t': '0:2', 'n': 'C5', 'd': '4n'},
{'t': '0:3', 'n': 'D5', 'd': '8n'},
{'t': '0:4', 'n': 'E5', 'd': '8n'},
{'t': '0:5', 'n': 'E5', 'd': '4n'},
{'t': '0:6', 'n': 'E5', 'd': '8n'},
{'t': '0:7', 'n': 'D5', 'd': '8n'},
{'t': '0:8', 'n': 'C5', 'd': '4n'},
{'t': '0:9', 'n': 'D5', 'd': '8n'},
{'t': '0:10', 'n': 'E5', 'd': '8n'},
{'t': '0:11', 'n': 'E5', 'd': '8n'},
{'t': '0:12', 'n': 'E5', 'd': '8n'},
{'t': '0:13', 'n': 'D5', 'd': '8n'},
{'t': '0:14', 'n': 'C5', 'd': '4n'},
{'t': '0:15', 'n': 'C5', 'd': '8n'},
{'t': '0:15.5', 'n': 'D5', 'd': '16n'},
{'t': '0:16', 'n': 'E5', 'd': '4n'},
{'t': '0:17', 'n': 'E5', 'd': '8n'},
{'t': '0:18', 'n': 'D5', 'd': '8n'},
{'t': '0:19', 'n': 'C5', 'd': '4n'},
{'t': '0:20', 'n': 'D5', 'd': '8n'},
{'t': '0:21', 'n': 'E5', 'd': '8n'},
{'t': '0:22', 'n': 'E5', 'd': '8n'},
{'t': '0:23', 'n': 'D5', 'd': '8n'},
{'t': '0:24', 'n': 'C5', 'd': '4n'},
{'t': '0:25', 'n': 'E5', 'd': '8n'},
{'t': '0:26', 'n': 'E5', 'd': '8n'},
{'t': '0:27', 'n': 'F5', 'd': '4n'},
{'t': '0:28', 'n': 'D5', 'd': '8n'},
{'t': '0:29', 'n': 'C5', 'd': '2n'}])

const chords = gptFormatToToneFormat([
  {'t': 0, 'n': ['C4', 'E4', 'G4'], 'd': '2n'},
  {'t': '0:2', 'n': ['C4', 'E4', 'G4'], 'd': '2n'},
  {'t': '0:4', 'n': ['C4', 'E4', 'G4'], 'd': '2n'},
  {'t': '0:6', 'n': ['C4', 'E4', 'G4'], 'd': '2n'},
  {'t': '0:8', 'n': ['F3', 'A3', 'C4'], 'd': '2n'},
  {'t': '0:10', 'n': ['F3', 'A3', 'C4'], 'd': '2n'},
  {'t': '0:12', 'n': ['F3', 'A3', 'C4'], 'd': '2n'},
  {'t': '0:14', 'n': ['F3', 'A3', 'C4'], 'd': '2n'},
  {'t': '0:16', 'n': ['G3', 'B3', 'D4'], 'd': '2n'},
  {'t': '0:18', 'n': ['G3', 'B3', 'D4'], 'd': '2n'},
  {'t': '0:20', 'n': ['G3', 'B3', 'D4'], 'd': '2n'},
  {'t': '0:22', 'n': ['G3', 'B3', 'D4'], 'd': '2n'},
  {'t': '0:24', 'n': ['A3', 'C4', 'E4'], 'd': '2n'},
  {'t': '0:26', 'n': ['A3', 'C4', 'E4'], 'd': '2n'},
  {'t': '0:28', 'n': ['A3', 'C4', 'E4'], 'd': '2n'},
  {'t': '0:30', 'n': ['A3', 'C4', 'E4'], 'd': '2n'}
]);

const bassline = gptFormatToToneFormat([{'t': '0:0', 'n': 'E3', 'd': '4n'},
{'t': '0:1', 'n': 'E3', 'd': '4n'},
{'t': '0:2', 'n': 'E3', 'd': '2n'},
{'t': '0:4', 'n': 'E3', 'd': '4n'},
{'t': '0:5', 'n': 'E3', 'd': '4n'},
{'t': '0:6', 'n': 'E3', 'd': '2n'},
{'t': '0:8', 'n': 'G3', 'd': '4n'},
{'t': '0:9', 'n': 'G3', 'd': '4n'},
{'t': '0:10', 'n': 'G3', 'd': '2n'},
{'t': '0:12', 'n': 'C3', 'd': '4n'},
{'t': '0:13', 'n': 'C3', 'd': '4n'},
{'t': '0:14', 'n': 'C3', 'd': '2n'},
{'t': '0:16', 'n': 'D3', 'd': '4n'},
{'t': '0:17', 'n': 'D3', 'd': '4n'},
{'t': '0:18', 'n': 'D3', 'd': '2n'},
{'t': '0:20', 'n': 'E3', 'd': '4n'},
{'t': '0:21', 'n': 'E3', 'd': '4n'},
{'t': '0:22', 'n': 'E3', 'd': '2n'},
{'t': '0:24', 'n': 'G3', 'd': '4n'},
{'t': '0:25', 'n': 'G3', 'd': '4n'},
{'t': '0:26', 'n': 'G3', 'd': '2n'},
{'t': '0:28', 'n': 'C3', 'd': '4n'},
{'t': '0:29', 'n': 'C3', 'd': '4n'},
{'t': '0:30', 'n': 'C3', 'd': '2n'}]);

const mainMelodyPart = new Tone.Part(function (time, note) {
  mainMelodyInstrument.triggerAttackRelease(note.note, note.duration, time);
}, mainMelody).start(0);

const chordsPart = new Tone.Part(function (time, note) {
  chordsInstrument.triggerAttackRelease(note.note, note.duration, time);
}, chords).start(0);

const basslinePart = new Tone.Part(function (time, note) {
  basslineInstrument.triggerAttackRelease(note.note, note.duration, time);
}, bassline).start(0); */


// const part = new Tone.Part(function (time, note) {
//   pianoChords.triggerAttackRelease(note.note, note.duration, time);
// }, chords).start(0);


// const mainMelodyPart = new Tone.Part(function (time, note) {
//   pianoMain.triggerAttackRelease(note.note, note.duration, time);
// }, melody).start(0);


// const lowPass = new Tone.Filter({
//   frequency: 8000,
// }).toMaster();

document.getElementById("play-button").addEventListener("click", function () {
  if (Tone.Transport.state !== 'started') {
    Tone.Transport.start();
  } else {
    Tone.Transport.stop();
  }
});




