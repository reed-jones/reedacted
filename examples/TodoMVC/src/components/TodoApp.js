import { createElement } from "@j0nz/reedacted";

import TodoHeader from "./TodoHeader";
import TodoBody from "./TodoBody";
import TodoFooter from "./TodoFooter";
export default ({ state }) => (
  <section class="todoapp">
    <TodoHeader />
    <TodoBody />
    <TodoFooter />
  </section>
);
