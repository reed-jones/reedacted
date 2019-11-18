import { createElement } from "@j0nz/reedacted";
import { pluralize } from "~/utils";

// clear completed button
const ClearBtn = ({ state }) => {
  const removeCompleted = event => {
    state.todos = state.todos.filter(todo => !todo.completed);
  };

  if (state.todos.length > state.remaining) {
    return (
      <button class="clear-completed" onClick={removeCompleted}>
        Clear completed
      </button>
    );
  }
};

//bottom row filter buttons
const FilterItem = ({ state, props }) => {
  const isVisible = _ => {
    return state.visibility === props.filter;
  };

  return (
    <li>
      <a
        href={`#/${props.filter}`}
        class={{ selected: isVisible(props.filter) }}
      >
        {props.label}
      </a>
    </li>
  );
};

export default ({ state }) => {
  if (!state.todos.length) {
    return "";
  }

  return (
    <footer class="footer">
      <span class="todo-count">
        <strong>{state.remaining}</strong>
        {pluralize("item", state.remaining)} left
      </span>
      <ul class="filters">
        <FilterItem filter="all" label="All" />
        <FilterItem filter="active" label="Active" />
        <FilterItem filter="completed" label="Completed" />
      </ul>
      <ClearBtn />
    </footer>
  );
};
