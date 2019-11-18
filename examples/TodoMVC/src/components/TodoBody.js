import { createElement, useState } from "@j0nz/reedacted";
import TodoItem from "./TodoItem";

export default ({ state }) => {
  const allDone = e => {
    state.todos = state.todos.map(todo => ({
      ...todo,
      completed: e.target.checked
    }));
  };
  const removeTodo = todo => {
    state.todos = state.todos.filter(t => t.id !== todo.id);
  };

  return (
    <section class="main">
      <input
        id="toggle-all"
        class="toggle-all"
        type="checkbox"
        checked={!state.remaining}
        onChange={allDone}
      />
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        {state.filteredTodos.map((t, i) => (
          <TodoItem todo={t} $onRemove={_ => removeTodo(t)} />
        ))}
      </ul>
    </section>
  );
};
