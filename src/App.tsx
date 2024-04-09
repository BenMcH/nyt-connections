import { createSignal } from 'solid-js'
import './App.css'

import connections from './connections.json'
import toast, { Toaster } from 'solid-toast';

const { answers: answer, date } = shuffle(connections)[0];

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;
  const newArr = [...array];

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [newArr[currentIndex], newArr[randomIndex]] = [
      newArr[randomIndex], newArr[currentIndex]];
  }

  return newArr
}

function App() {
  const data = shuffle(answer.flatMap(a => a.members));

  const [groups, setGroups] = createSignal<typeof answer>([]);
  const [options, setOptions] = createSignal(data.map((option) => ({ option, selected: false })));

  function toggle(option: string) {
    const newOptions = options().map((o) => o.option === option ? { ...o, selected: !o.selected } : o);

    const selected = newOptions.filter((o) => o.selected);

    if (selected.length > 4) {
      return;
    }

    setOptions(newOptions);
  }

  function submit() {
    const selected = options().filter((o) => o.selected).map((o) => o.option);

    const found = answer.find((a) => a.members.every((o) => selected.includes(o)));

    if (found) {
      const newGroups = groups().concat(found);
      newGroups.sort((a, b) => a.level - b.level);
      setGroups(newGroups);
      setOptions(options().filter((o) => !o.selected));
    } else {
      toast("Invalid group", { duration: 2500 })
    }
  }

  function deselectAll() {
    setOptions(options().map((o) => ({ ...o, selected: false })));
  }

  return (
    <main>
      <h1>{new Date(date).toLocaleDateString()}</h1>
      <div class='option-grid'>
        {groups().map((group) => (
          <div class={`group group-${group.level}`}>
            <p>{group.group}</p>
            <p class="list">
              {group.members.map((option) => (
                <span class="option">{option}</span>
              ))}
            </p>
          </div>
        ))}
        {options().map(({ option, selected }) => (
          <div class={`option ${selected && 'selected'}`} onClick={() => toggle(option)}>
            {option}
          </div>
        ))}
      </div>
      <div class="button-group">
        <button onClick={() => setOptions(shuffle(options()))}>Shuffle</button>
        <button onClick={deselectAll}>Deselect All</button>
        <button onClick={submit}>Submit</button>
        <Toaster />
      </div>
    </main>
  )
}

export default App
