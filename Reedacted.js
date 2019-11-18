import { Reaction } from "./Reaction";

const EFFECTS = {
  PLACEMENT: "PLACEMENT",
  DELETION: "DELETION",
  UPDATE: "UPDATE"
};

const CUSTOM_TYPES = {
  TEXT_ELEMENT: "TEXT_ELEMENT"
};

// global shared state (Reaction)
let _state = {};

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

let wipFiber = null;
let hookIndex = null;


const isEvent = key => key.startsWith("on");
const isCustomEvent = key => key.startsWith("$on"); // TODO: currently $on logic is inlined
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

//
const ClassesFromObject = classObj => {
  return Object.entries(classObj)
    .filter(([className, is_used]) => is_used)
    .reduce((acc, [className, is_used]) => [...acc, className], [])
    .join(" ");
};

const ClassesFromArray = classArr => {
  return classArr.filter(a => a).join(" ");
};

const complexClass = className => {
  return Array.isArray(className)
    ? ClassesFromArray(className)
    : ClassesFromObject(className);
};

const createElement = (type, props, ...children) => {
  let className = props && props.class;
  if (className) {
    className =
      typeof className === "string" ? className : complexClass(className);
  }

  return {
    type,
    props: {
      ...props,
      ...(className && { className }), // remaps class="" to className=""
      ...(props && props.for && { htmlFor: props.for }), // remaps for="" to htmlFor=""
      children: children
        .flat()
        .map(child =>
          typeof child === "object" ? child : createTextElement(child)
        )
    }
  };
};

const createTextElement = text => {
  return {
    type: CUSTOM_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: []
    }
  };
};

const createDom = fiber => {
  const dom =
    fiber.type === CUSTOM_TYPES.TEXT_ELEMENT
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
};

const updateDom = (dom, prevProps, nextProps) => {
  // TODO: use or remove
  // Object.keys(prevProps)
  //     .filter(key => key.includes(':'))
  //     .forEach(k => console.log(k))

  // Object.keys(nextProps)
  // .filter(key => key.includes(':'))
  // .forEach(k => console.log(k))
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
};

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const commitWork = fiber => {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === EFFECTS.PLACEMENT && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === EFFECTS.UPDATE && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === EFFECTS.DELETION) {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    /**
     * Apiologies for the hack. Without resetting the event loop
     * lists were not rendering properly for removals
     * TODO: Fix this properly
     */
    setTimeout(_ => {
      try {
        domParent.removeChild(fiber.dom);
      } catch (err) {
        // currently dom removal is not the high point of this library
      }
    }, 0);
  } else {
    commitDeletion(fiber.child, domParent);
  }
};

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

// Game Loop
const workLoop = deadline => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
};
requestIdleCallback(workLoop);

const performUnitOfWork = fiber => {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};


const updateFunctionComponent = fiber => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const $emit = Object.entries(fiber.props)
    .filter(([key]) => key.startsWith("$on"))
    .reduce(
      (acc, [key, event]) => ({
        ...acc,
        [key.toLowerCase().substring(3)]: event
      }),
      {}
    );
  wipFiber.$emit = (key, params) =>
    key.toLowerCase() in $emit && $emit[key.toLowerCase()](params);

  const details = { props: fiber.props, state: _state, $emit: wipFiber.$emit };
  const children = [fiber.type(details)];

  reconcileChildren(fiber, children);
};

const useState = initial => {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action(hook.state);
  });

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
};

const updateHostComponent = fiber => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
};

const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: EFFECTS.UPDATE
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: EFFECTS.PLACEMENT
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = EFFECTS.DELETION;
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

class Reedacted {
  constructor({ el, root, data, computed, onUpdate }) {
    _state = new Reaction({
      data,
      computed,

      onUpdate(...args) {
        if (!currentRoot) {
          return;
        }

        wipRoot = {
          dom: currentRoot.dom,
          props: currentRoot.props,
          alternate: currentRoot
        };

        nextUnitOfWork = wipRoot;
        deletions = [];

        if (onUpdate) {
          onUpdate.bind(_state)();
        }
      }
    });

    render(root, document.querySelector(el));

    return _state;
  }
}

export default Reedacted;

export { Reedacted, createElement, createElement as h, useState };
