const DEFAULT_API = [
  'state', 'props', 'helpers', 'events', 'onCreated', 'onRendered', 'onDestroyed'
];

// Helpers
const withTemplateInstanceContext = function(handler) {
  return function() {
    return handler.apply(Template.instance(), arguments);
  };
};

const bindToTemplateInstance = function(handlers) {
  for (let key of Object.keys(handlers)) {
    handlers[key] = withTemplateInstanceContext(handlers[key]);
  }
  return handlers;
};

const generateReactiveAccessor = function(defaultValue) {
  let value = new ReactiveVar(defaultValue);
  return function(newValue) {
    if (newValue !== undefined) {
      value.set(newValue);
    } else {
      return value.get();
    }
  };
};

const generateTrigger = function(eventName, object) {
  return function(args) {
    Template.instance().$(object).trigger(eventName, args);
  }
};

// Errors
class TemplateNotFoundError extends ExtendableError {
  constructor(templateName) {
    super(`No template <${templateName}> found.`);
  }
}

class PropertyValidatorRequired extends ExtendableError {
  constructor() {
    super('<data> must be a validator with #clean and #validate methods (see: SimpleSchema)');
  }
}

// We have to make it a global to support Meteor 1.2.x
TemplateController = function(templateName, config) {
  // Template reference
  let template = Template[templateName];
  if (!template) {
    throw new TemplateNotFoundError(templateName);
  }
  let { state, props, helpers, events, trigger, onCreated, onRendered, onDestroyed } = config;

  // Remove all standard api props fromt he config so we can have add the
  // rest to the template instance!
  for (apiProp of DEFAULT_API) {
    delete config[apiProp];
  }

  // State & private instance methods, as well as event triggers
  template.onCreated(function() {
    if (state) {
      this.state = {};
      // Setup the state as reactive vars
      for (let key of Object.keys(state)) {
        this.state[key] = generateReactiveAccessor(state[key]);
      }
    }
    // Private
    if (config.private) {
      for (let key of Object.keys(config.private)) {
        this[key] = config.private[key];
      }
    }
    if (trigger) {
      this.trigger = {};
      // Setup the trigger as a set of function calls to wrap event triggers
      for (let key of Object.keys(trigger)) {
        this.trigger[key] = generateTrigger(key, trigger[key]);
      }
    }
  });

  // Default values for props
  if (props) {
    template.onCreated(function() {
      this.props = {};
      this.autorun(() => {
        if (!props.validate) throw new PropertyValidatorRequired();
        let currentData = Template.currentData() || {};
        props.clean(currentData);
        props.validate(currentData);
        for (let key of Object.keys(currentData)) {
          let value = currentData[key];
          if (!this.props[key]) {
            this.props[key] = generateReactiveAccessor(value);
          } else {
            this.props[key](value);
          }
        }
      });
    });
  }
  // Helpers
  if (helpers) {
    helpers.state = function() { return this.state; };
    helpers.props = function() { return this.props; };
    template.helpers(bindToTemplateInstance(helpers));
  }
  // Events
  if (events) {
    template.events(bindToTemplateInstance(events));
  }
  // Lifecycle
  if (onCreated) template.onCreated(onCreated);
  if (onRendered) template.onRendered(onRendered);
  if (onDestroyed) template.onDestroyed(onDestroyed);

};
