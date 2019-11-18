class ReactionFramework {
  constructor({ data = {}, computed = {}, onUpdate = null }) {
    const validator = base => ({
      get(obj, key) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          return new Proxy(obj[key], validator(base));
        } else {
          return Reflect.get(obj, key);
        }
      },
      set(obj, key, val) {
        obj[key] = val;
        if (typeof base.$actions.onUpdate === "function") {
          base.$actions.onUpdate.bind(prox)(base);
        }
        return Reflect.set(obj, key, val);
      }
    });

    this.$data = new Proxy(data, validator(this));
    this.$computed = computed;
    this.$actions = { onUpdate };

    let prox = new Proxy(this, {
      get(obj, key) {
        if (Object.keys(obj.$computed).includes(key)) {
          return obj.$computed[key].bind(prox)();
        } else if (Object.keys(obj.$data).includes(key)) {
          return Reflect.get(obj.$data, key);
        } else {
          return Reflect.get(obj, key);
        }
      },
      set(obj, key, val) {
        // disallow update on computed properties
        if (Object.keys(obj.$computed).includes(key)) {
          return true; // Reflect.set(_self.computed, key, val)
        } else if (Object.keys(obj.$data).includes(key)) {
          let updated = Reflect.set(obj.$data, key, val);
          if (typeof obj.$actions.onUpdate === "function") {
            obj.$actions.onUpdate.bind(prox)(obj);
          }

          return updated;
        }
        let updated = Reflect.set(obj.$data, key, val);
        if (typeof obj.$actions.onUpdate === "function") {
          obj.$actions.onUpdate.bind(prox)(obj);
        }

        return updated;
      }
    });

    // call once for initial render
    if (typeof this.$actions.onUpdate === "function") {
      this.$actions.onUpdate.bind(prox)(this);
    }
    return prox;
  }
}

export const Reaction = ReactionFramework;
