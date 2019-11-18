import { createElement } from "@j0nz/reedacted";
import { ENTER_KEY, ESC_KEY } from "~/keyCodes";

export default ({ state, props, $emit }) => {
  const checkItem = e => {
    props.todo.completed = !props.todo.completed;
    if (!state.filteredTodos.some(({ id }) => id === props.todo.id)) {
      e.preventDefault();
    }
  };

  const editTodo = event => {
    // can dynamically add new keys to state.$data!
    state.beforeEditCache = props.todo.title;

    state.editedTodo = props.todo.id;
    setTimeout(_ => {
      const el = document.getElementById(`todo_input_${props.todo.id}`);
      el.focus();
      el.select();
    }, 100);
  };

  const doneEdit = event => {
    if (!state.editedTodo && state.editedTodo !== 0) {
      return;
    }

    state.editedTodo = null;
    props.todo.title = props.todo.title.trim();
    if (!props.todo.title) {
      $emit("remove");
    }
  };

  const cancelEdit = event => {
    state.editedTodo = null;

    // Props from state maintain reactivity
    props.todo.title = state.beforeEditCache;
  };

  const editKeydown = event => {
    switch (event.keyCode) {
      case ENTER_KEY:
        return doneEdit();
      case ESC_KEY:
        return cancelEdit();
    }
  };

  return (
    <li
      class={{
        todo: true,
        completed: props.todo.completed,
        editing: props.todo.id === state.editedTodo
      }}
    >
      <div class="view">
        <input
          class="toggle"
          type="checkbox"
          checked={props.todo.completed}
          onClick={checkItem}
        />
        <label onDblClick={editTodo}>{props.todo.title}</label>

        {/* Emit events to parent */}
        <button class="destroy" onClick={_ => $emit("remove")}></button>
      </div>
      <input
        class="edit"
        type="text"
        id={"todo_input_" + props.todo.id}
        value={props.todo.title}
        onInput={e => (props.todo.title = e.target.value)}
        onBlur={doneEdit}
        onKeyUp={editKeydown}
      />
    </li>
  );
};
