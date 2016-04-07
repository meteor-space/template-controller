import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import ExtendableError from 'es6-error';

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

const TemplateController = function(templateName, config) {
  // Template reference
  let template = Template[templateName];
  if (!template) {
    throw new TemplateNotFoundError(templateName);
  }
  let { state, props, helpers, events, onCreated, onRendered, onDestroyed } = config;

  // Remove all standard api props fromt he config so we can have add the
  // rest to the template instance!
  for (apiProp of DEFAULT_API) {
    delete config[apiProp];
  }

  // State & Custom instance methods
  if (state) {
    template.onCreated(function() {
      this.state = {};
      // Setup the state as reactive vars
      for (let key of Object.keys(state)) {
        this.state[key] = generateReactiveAccessor(state[key]);
      }
      // Add the custom helpers and properties to the template instance
      for (let key of Object.keys(config)) {
        this[key] = config[key];
      }
    });
  }
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

export default TemplateController;
