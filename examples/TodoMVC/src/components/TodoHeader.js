import { createElement } from "@j0nz/reedacted";
import { ENTER_KEY } from "~/keyCodes";

export default ({ state }) => {
  const addTodo = event => {
    if (event.keyCode !== ENTER_KEY) {
      return;
    }
    const value = state.newTodo && state.newTodo.trim();
    if (!value) {
      return;
    }

    state.todos.push({
      id: ++state.counter,
      title: value,
      completed: false
    });
    state.newTodo = "";
  };

  return (
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        autofocus
        autocomplete="off"
        placeholder="What needs to be done?"
        value={state.newTodo}
        onInput={({ target }) => (state.newTodo = target.value)}
        onKeyUp={addTodo}
      />
    </header>
  );
};
