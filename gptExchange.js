const compositionButton = document.getElementById("get-composition");
const apiKeyField = document.getElementById("gpt-api-key");
const compositionSettingField = document.getElementById("composition-setting");
let isCompositionLoading = false;
const systemMessage = {
  role: "system",
  content: "You are a music composer assistant. All your musical compositions are 30 seconds long. Your musical compositions are not repetitive. When you are given a setting for the composition, you must choose the following properties for your composition: mood, key, time signature, bpm, instruments (no more than 3 instruments, you can only choose from the following instruments: bass-electric\nbassoon\ncello\nclarinet\ncontrabass\nflute\nfrench-horn\nguitar-acoustic\nguitar-electric\nharmonium\nharp\norgan\npiano\nsaxophone\ntrombone\ntrumpet\ntuba\nviolin\nxylophone), and melody parts (at least 3. e.g., main melody, chords, counter melody, bassline, etc.). You can only respond in code. You should not say anything else that is not code. The output code has to be minified valid json with no new lines in the following formats:\n\n- For the properties:\n{\n\"composition_name\": \"...\",\n\"mood\": \"...\",\n\"motif_notes\": [\"...\"],\n\"key\": \"...\".\n\"timeSignature\": \"...\",\n\"bpm\": ...,\n\"instruments\": [...],\n\"melodyParts\": [\n{\n  \"instrument\": ...,\n  \"type\": \"mainMelodyRightHand\"\n}, ...\n]\n}\n\n"
}

const followUpMessage = (composition) => {
  return {
    role: "system",
    content: `You are a music composer assistant. All your musical compositions are 30 seconds long. Your musical compositions are not repetitive. Your composition has the following properties: ${JSON.stringify(composition)}.

    When asked to compose a part, you will do so based on the properties you chose earlier and will stick to the duration of 30 seconds for each part.  You can only respond in code. You should only output the required code, no other text. The output code has to be minified valid json with no new lines in the following formats:\n\n- For the composition notation:\n[{\"t\": \"0:8\", \"n\": \"C5\", \"d\": \"4n\"},\n  {\"t\": \"0:9\", \"n\": \"D5\", \"d\": \"4n\"},\n  {\"t\": \"0:10\", \"n\": \"E5\", \"d\": \"2n\"},\n  {\"t\": \"0:12\", \"n\": \"A4\", \"d\": \"4n\"}, ...]\n\n- For the chords or multiple notes played at the same time:\n[\n  {\"t\": 0, \"n\": [\"G3\", \"B3\", \"D4\"], \"d\": \"3n\"},\n  {\"t\": \"0:2\", \"n\": [\"G3\", \"B3\", \"D4\"], \"d\": \"2n\"}, ...]

    \n\n the t field is the time, the n field is the note and can be a single note or an array of notes, and the d field is the duration. The duration can be in the following formats: 1n, 2n, 3n, 4n, ... and it signifies the length of the note (e.g., 8n is 8th of a note). Vary the notes, durations and the rhythm to make the composition interesting.`
  }
}

const populateCompositionResults = (composition) => {
  const compositionTitle = document.getElementById("composition-title");
  const compositionMood = document.getElementById("composition-mood");
  const compositionKey = document.getElementById("composition-key");
  const compositionTime = document.getElementById("composition-time");
  const compositionTempo = document.getElementById("composition-tempo");
  const compositionInstruments = document.getElementById("composition-instruments");
  const compositionMelodyParts = document.getElementById("composition-melody-parts");

  compositionTitle.classList.remove("empty");
  compositionTitle.innerHTML = `${composition.composition_name}`;
  compositionMood.innerHTML = `Mood: ${composition.mood}`;
  compositionKey.innerHTML = `Key: ${composition.key}`;
  compositionTime.innerHTML = `Time Signature: ${composition.timeSignature}`;
  compositionTempo.innerHTML = `Tempo: ${composition.bpm}`;
  compositionInstruments.innerHTML = `Instruments: ${composition.instruments.join(", ")}`;
  compositionMelodyParts.innerHTML = `Melody Parts: <ul>${composition.melodyParts.map(part => `<li id="${part.type}" class="flex flex-row items-center">${part.type} - ${part.instrument}</li>`).join("")}</ul>`;
}

const getCompositionProperties = async (apiKey, setting) => {
  let messages = [systemMessage, {
    role: "user",
    content: `Setting: "${setting}"`
  }]

  const res = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: messages,
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }
  });

  if (res.error) {
   throw new Error(res.error);
  }
  const composition = res.data.choices[0].message.content;
  const formattedComposition = composition.replace(/\n/g, "").replace(/\t/g, "").replace(/\r/g, "");
  console.log(formattedComposition);
  const compositionJson = JSON.parse(formattedComposition);
  compositionJson.setting = setting;
  // compositionSettingField.value = JSON.stringify(compositionJson);
  return compositionJson;
}

const getCompositionParts = async (apiKey, composition) => {
  const followUpMessages = [followUpMessage(composition)];
  const compositionParts = composition.melodyParts;
  const result = [];
  for (let i = 0; i < compositionParts.length; i++) {
    let partField = document.getElementById(compositionParts[i].type);
    let originalPartField = partField.innerHTML;
    partField.innerHTML = partField.innerHTML + "<div class='loading-spinner'></div>";
    let part = compositionParts[i];
    const partType = part.type;
    followUpMessages.push({
      role: "user",
      content: `Provide the ${partType} part. It has to be 30 seconds long.`
    })
    let res = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: followUpMessages,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    });
    if (res.error) {
      throw new Error(res.error);
    }


    const compositionPart = res.data.choices[0].message.content;
    // strip any text before or after the json
    const start = compositionPart.split("[")[0].length;
    const end = compositionPart.split("]")[compositionPart.split("]").length - 1].length;
    const compositionPartJson = compositionPart.substring(start, compositionPart.length - end);
    const formattedCompositionPart = compositionPartJson.replace(/\n/g, "").replace(/\t/g, "").replace(/\r/g, "");
    followUpMessages.push({
      role: "assistant",
      content: formattedCompositionPart
    });

    console.log(formattedCompositionPart);
    result.push({
      type: partType,
      melody: JSON.parse(formattedCompositionPart),
      instrument: part.instrument
    });
    partField.innerHTML = originalPartField + "<div class='loading-done'></div>";
  }
  return result;
}

  const getNewGPTComposition = async function () {
    try {
      if (isCompositionLoading) return;
      document.getElementById("play-button").disabled = true;
      const apiKey = apiKeyField.value;
      const compositionSetting = compositionSettingField.value;
      if (!apiKey) {
        alert("Please enter an API key");
        return;
      }
      if (!compositionSetting) {
        alert("Please enter a composition setting");
        return;
      }

      isCompositionLoading = true;
      compositionButton.innerHTML = "Loading...";
      compositionButton.disabled = true;
      const compositionProperties = await getCompositionProperties(apiKey, compositionSetting);
      populateCompositionResults(compositionProperties);
      const compositionParts = await getCompositionParts(apiKey, compositionProperties);
      console.log(compositionParts);
      prepareComposition(compositionProperties, compositionParts);

    } catch (e) {
      console.log(e);
    } finally {
      isCompositionLoading = false;
      compositionButton.innerHTML = "Get Composition";
      compositionButton.disabled = false;
    }
  }

  function testMusic () {
    const compositionProperties = {"mood": "mysterious", "key": "D minor", "timeSignature": "4/4", "bpm": 100, "instruments": ["piano", "cello", "clarinet"], "melodyParts": [{"instrument": "piano", "type": "mainMelodyRightHand"},                 {"instrument": "cello", "type": "counterMelody"},                 {"instrument": "clarinet", "type": "mainMelodyLeftHand"},                 {"instrument": "piano", "type": "chords"}]};
    const compositionParts = [
      {
        type: "mainMelodyRightHand",
        instrument: "piano",
        melody: [{"t":"0:0","n":"E5","d":"2n"},{"t":"0:2","n":"C5","d":"4n"},{"t":"0:2","n":"E5","d":"4n"},{"t":"0:3","n":"G5","d":"4n"},{"t":"0:6","n":"G4","d":"2n"},{"t":"0:8","n":"E5","d":"2n"},{"t":"0:10","n":"C5","d":"4n"},{"t":"0:10","n":"E5","d":"4n"},{"t":"0:11","n":"G5","d":"4n"},{"t":"0:14","n":"D5","d":"2n"},{"t":"0:16","n":"D6","d":"2n"},{"t":"0:18","n":"C6","d":"2n"},{"t":"0:20","n":"B5","d":"4n"},{"t":"0:20","n":"D6","d":"4n"},{"t":"0:21","n":"F6","d":"4n"},{"t":"0:24","n":"E5","d":"2n"},{"t":"0:26","n":"C5","d":"4n"},{"t":"0:26","n":"E5","d":"4n"},{"t":"0:27","n":"G5","d":"4n"},{"t":"0:30","n":"G4","d":"2n"},{"t":"0:32","n":"E5","d":"2n"},{"t":"0:34","n":"C5","d":"4n"},{"t":"0:34","n":"E5","d":"4n"},{"t":"0:35","n":"G5","d":"4n"},{"t":"0:38","n":"D5","d":"2n"},{"t":"0:40","n":"D6","d":"2n"},{"t":"0:42","n":"C6","d":"2n"},{"t":"0:44","n":"B5","d":"4n"},{"t":"0:44","n":"D6","d":"4n"},{"t":"0:45","n":"F6","d":"4n"},{"t":"0:48","n":"E5","d":"2n"}]
      }, {
        type: "counterMelody",
        instrument: "cello",
        melody: [{"t":0,"n":"B4","d":"8n"},{"t":"0:1","n":"D5","d":"8n"},{"t":"0:2","n":"B5","d":"8n"},{"t":"0:3","n":"G5","d":"8n"},{"t":"0:4","n":"A5","d":"8n"},{"t":"0:5","n":"G5","d":"8n"},{"t":"0:6","n":"F#5","d":"8n"},{"t":"0:7","n":"G5","d":"8n"},{"t":"0:8","n":"B5","d":"8n"},{"t":"0:9","n":"G5","d":"8n"},{"t":"0:10","n":"F#5","d":"8n"},{"t":"0:11","n":"E5","d":"8n"},{"t":"0:12","n":"D5","d":"8n"},{"t":"0:13","n":"E5","d":"8n"},{"t":"0:14","n":"D5","d":"8n"},{"t":"0:15","n":"C#5","d":"4n"},{"t":"0:15","n":"E5","d":"4n"},{"t":"0:16","n":"G5","d":"4n"},{"t":"0:17","n":"B5","d":"4n"},{"t":"0:18","n":"G5","d":"4n"},{"t":"0:19","n":"F#5","d":"4n"},{"t":"0:20","n":"G5","d":"4n"},{"t":"0:21","n":"F#5","d":"4n"},{"t":"0:22","n":"E5","d":"4n"},{"t":"0:23","n":"D5","d":"4n"},{"t":"0:24","n":"E5","d":"4n"},{"t":"0:25","n":"D5","d":"4n"},{"t":"0:26","n":"C#5","d":"4n"},{"t":"0:27","n":"E5","d":"4n"},{"t":"0:28","n":"G5","d":"4n"},{"t":"0:29","n":"B5","d":"4n"},{"t":"0:30","n":"G5","d":"4n"},{"t":"0:31","n":"F#5","d":"4n"},{"t":"0:32","n":"G5","d":"4n"},{"t":"0:33","n":"F#5","d":"4n"},{"t":"0:34","n":"E5","d":"4n"},{"t":"0:35","n":"D5","d":"4n"},{"t":"0:36","n":"C#5","d":"4n"},{"t":"0:37","n":"D5","d":"4n"},{"t":"0:38","n":"E5","d":"4n"},{"t":"0:39","n":"D5","d":"4n"},{"t":"0:40","n":"C#5","d":"4n"},{"t":"0:41","n":"D5","d":"4n"},{"t":"0:42","n":"E5","d":"4n"},{"t":"0:43","n":"D5","d":"4n"},{"t":"0:44","n":"C#5","d":"8n"},{"t":"0:44","n":"E5","d":"8n"},{"t":"0:45","n":"G5","d":"8n"},{"t":"0:46","n":"B5","d":"8n"},{"t":"0:47","n":"G5","d":"8n"},{"t":"0:48","n":"F#5","d":"8n"},{"t":"0:49","n":"G5","d":"8n"},{"t":"0:50","n":"F#5","d":"8n"},{"t":"0:51","n":"E5","d":"8n"},{"t":"0:52","n":"D5","d":"8n"},{"t":"0:53","n":"E5","d":"8n"},{"t":"0:54","n":"D5","d":"8n"},{"t":"0:55","n":"C#5","d":"8n"}]
      }, {
        type: "mainMelodyLeftHand",
        instrument: "clarinet",
        melody: [{"t":0,"n":"A2","d":"2n"},{"t":2,"n":"G2","d":"4n"},{"t":4,"n":"A2","d":"4n"},{"t":6,"n":"B2","d":"2n"},{"t":8,"n":"C3","d":"2n"},{"t":10,"n":"B2","d":"2n"},{"t":12,"n":"A2","d":"2n"},{"t":14,"n":"B2","d":"2n"},{"t":16,"n":"G2","d":"2n"},{"t":18,"n":"F#2","d":"2n"},{"t":20,"n":"E2","d":"2n"},{"t":22,"n":"D2","d":"2n"},{"t":24,"n":"E2","d":"2n"},{"t":26,"n":"F#2","d":"2n"},{"t":28,"n":"G2","d":"2n"}]
      }, {
        type: "chords",
        instrument: "piano",
        melody: [{"t":0,"n":["G2","B2","D3"],"d":"2n"},{"t":4,"n":["G2","B2","D3"],"d":"2n"},{"t":8,"n":["C3","E3","G3"],"d":"2n"},{"t":12,"n":["C3","E3","G3"],"d":"2n"},{"t":16,"n":["G2","B2","D3"],"d":"2n"},{"t":20,"n":["G2","B2","D3"],"d":"2n"},{"t":24,"n":["C3","E3","G3"],"d":"2n"},{"t":28,"n":["C3","E3","G3"],"d":"2n"}]
      }
    ]
    prepareComposition(compositionProperties, compositionParts);
  }

  compositionButton.addEventListener("click", function () {
    // testMusic();
    getNewGPTComposition();
  });
