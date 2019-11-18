import Reedacted, { useState, createElement } from "@j0nz/reedacted";
import "todomvc-common/base.css";
import "todomvc-app-css/index.css";
import "./styles.css";
import { App } from "./components/App.js";
import { Router } from "director/build/director";

// import todo filters
import { filters } from "./utils";

let storedTodos = JSON.parse(
  localStorage.getItem("todo-reactive-todos") || "[]"
  // resetting the id re-keys base on current index, new todos get .length + 1 as id
).map((todo, id) => ({ ...todo, id }));

const state = new Reedacted({
  el: "#app", // dim div entry

  root: <App />, // App Entry point

  data: {
    // Should rename to state
    counter: storedTodos.length,
    todos: storedTodos,
    visibility: localStorage.getItem("todo-reactive-visibility") || "all"
  },

  computed: {
    filteredTodos() {
      return filters[this.visibility](this.todos);
    },
    remaining() {
      return filters.active(this.todos).length;
    }
  },

  onUpdate() {
    localStorage.setItem("todo-reactive-todos", JSON.stringify(this.todos));
    localStorage.setItem("todo-reactive-visibility", this.visibility);
  }
});

// url state routing via director https://github.com/flatiron/director
const routes = ["all", "active", "completed"].reduce(
  (acc, cur) => ({ ...acc, [`/${cur}`]: _ => (state.visbility = cur) }),
  {}
);

new Router(routes).init();
