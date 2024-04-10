import { createSignal } from 'solid-js'
import './App.css'

import connections from './connections.json'
import toast, { Toaster } from 'solid-toast';

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
  let { answers: answer, date } = connections[connections.length - 1];

  if (document.location.search) {
    const params = new URLSearchParams(document.location.search);
    const queryDate = params.get('date');

    if (queryDate) {
      const puzzle = connections.find((c) => c.date === queryDate);

      if (puzzle) {
        answer = puzzle.answers;
        date = puzzle.date;
      }
    }

    if (params.get('random')) {
      const puzzle = shuffle(connections)[0];

      answer = puzzle.answers;
      date = puzzle.date;
    }
  }

  // const { answers: answer, date } = shuffle(connections)[0];
  const data = shuffle(answer.flatMap(a => a.members));

  const [groups, setGroups] = createSignal<typeof answer>([]);
  const [options, setOptions] = createSignal(data.map((option) => ({ option, selected: false })));
  const [lives, setLives] = createSignal(4);

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

    if (selected.length < 4) {
      toast("Select 4 options", { duration: 1000 })
      return;
    }

    const found = answer.find((a) => a.members.every((o) => selected.includes(o)));

    if (found) {
      const newGroups = groups().concat(found);
      newGroups.sort((a, b) => a.level - b.level);
      setGroups(newGroups);
      setOptions(options().filter((o) => !o.selected));
    } else {
      toast("Invalid group", { duration: 2500 })
      setLives(lives() - 1);

      if (lives() === 0) {
        toast("Game Over", { duration: 5000 })
        setGroups(answer)
        setOptions([]);
      }
    }
  }

  function deselectAll() {
    setOptions(options().map((o) => ({ ...o, selected: false })));
  }

  const [year, month, day] = date.split('-');
  const dateFormatter = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <main>
      <h1>{dateFormatter.format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))}</h1>
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
      <p>Lives Remaining: {lives()}</p>
      <div class="button-group">
        <button onClick={() => setOptions(shuffle(options()))}>Shuffle</button>
        <button onClick={deselectAll}>Deselect All</button>
        <button onClick={submit}>Submit</button>
        <Toaster />
      </div>

      <a href="/">Today's Puzzle</a>
      <a href="/?random=1">Random Puzzle</a>
      <form method="get">
        <label>
          Pick your date (After {connections[0].date})
          <input type="date" name="date" />
        </label>
        <button type="submit">Go</button>
      </form>
    </main>
  )
}

export default App
