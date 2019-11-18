export const filters = {
  // show all todos
  all(todos) {
    return todos;
  },

  // filter active todos
  active(todos) {
    return todos.filter(todo => !todo.completed);
  },

  // filter completed todos
  completed(todos) {
    return todos.filter(todo => todo.completed);
  }
};

// converts an object, into a class string, using only the
// classes with truthy values i.e. ({ myClass: true })
export const classes = classObj => {
  return Object.entries(classObj)
    .filter(([className, is_used]) => is_used)
    .reduce((acc, [className, is_used]) => [...acc, className], [])
    .join(" ");
};

// pluralize words
export const pluralize = (word, count) => word + (count === 1 ? "" : "s");
