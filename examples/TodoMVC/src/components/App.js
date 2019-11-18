import { createElement } from "@j0nz/reedacted";

import TodoApp from "./TodoApp";
import PageFooter from "./PageFooter";

export const App = ({ state, props }) => (
  <div>
    <TodoApp />
    <PageFooter />
  </div>
);
