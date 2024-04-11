import { Accessor, createMemo, createSignal, onCleanup } from 'solid-js';
import './App.css';

import { effect } from 'solid-js/web';
import toast, { Toaster } from 'solid-toast';
import connections from './connections.json';

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
  let [game, setGame] = createSignal(connections[connections.length - 1]);

  const randomGame = () => setGame(shuffle(connections)[0]);
  const todaysGame = () => setGame(connections[connections.length - 1]);
  const datedGame = (date: string) => setGame(connections.find((c) => c.date === date) ?? game);

  function historyChange() {
    if (document.location.search) {
      const params = new URLSearchParams(document.location.search);
      const queryDate = params.get('date');

      if (queryDate) {
        datedGame(queryDate);
      }
    }
  }

  addEventListener('popstate', historyChange);
  onCleanup(() => removeEventListener('popstate', historyChange));

  historyChange();

  const [date, setDate] = createSignal(game().date);

  return (
    <main>
      <Game game={game} />
      <div class="button-group">
        <button onClick={todaysGame}>Today's Game</button>
        <button onClick={randomGame}>Random Game</button>
      </div>
      <form method="get" onSubmit={(e) => {
        e.preventDefault();
        datedGame(date());
      }}>
        <label>
          Pick your date (After {connections[0].date})
          <input
            type="date"
            name="date"
            value={date()}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
        </label>
        <button type="submit">Go</button>
      </form>
    </main>
  )
}

type GameData = typeof connections[number];

function Game({ game }: { game: Accessor<GameData> }) {

  const [groups, setGroups] = createSignal<GameData['answers']>([]);
  const [options, setOptions] = createSignal<{ option: string; selected: boolean }[]>([]);
  const [lives, setLives] = createSignal(4);

  effect(() => {
    setGroups([]);
    const _game = game();
    const answerKey = _game.answers;
    const data = shuffle(answerKey.flatMap(a => a.members));
    setOptions(data.map((option) => ({ option, selected: false })));
    setLives(4);

    if (!document.location.search.includes(_game.date)) {
      history.pushState({}, '', `?date=${_game.date}`);
    }
  });

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
      toast("Select 4 options", { duration: 2500 })
      return;
    }

    const found = game().answers.find((a) => a.members.every((o) => selected.includes(o)));

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
        setGroups(game().answers)
        setOptions([]);
      }
    }
  }

  function deselectAll() {
    setOptions(options().map((o) => ({ ...o, selected: false })));
  }

  const date = createMemo(() => {
    const [year, month, day] = game().date.split('-');
    const dateFormatter = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' });
    return dateFormatter.format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))
  })


  return (
    <>
      <h1>{date()}</h1>
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
    </>
  )
}

export default App
