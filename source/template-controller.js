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
const templateNotFoundError = function(templateName) {
  let error = new Error(`No template <${templateName}> found.`);
  error.name = 'TemplateNotFoundError';
  return error;
};

const propertyValidatorRequired = function() {
  let error = new Error(
    '<data> must be a validator with #clean and #validate methods (see: SimpleSchema)'
  );
  error.name = 'PropertyValidatorRequired';
  return error;
};

const propertyValidationError = function(error, templateName) {
  error.name = 'PropertyValidationError';
  error.message = `in <${templateName}> ` + error.message;
  return error;
};

const rootElementRequired = function() {
  let error = new Error(
    'Please define a single root DOM element for your template.\n' +
    'Learn more about this issue: https://github.com/meteor-space/template-controller/issues/6'
  );
  error.name = 'RootElementRequired';
  return error;
};

let propsCleanConfiguration = {};

// We have to make it a global to support Meteor 1.2.x
TemplateController = function(templateName, config) {
  // Template reference
  let template = Template[templateName];
  if (!template) {
    throw templateNotFoundError(templateName);
  }
  let { state, props, helpers, events, onCreated, onRendered, onDestroyed } = config;

  // Remove all standard api props fromt he config so we can have add the
  // rest to the template instance!
  for (apiProp of DEFAULT_API) {
    delete config[apiProp];
  }

  // State & private instance methods
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
    // Add sugar method for triggering custom jQuery events on the root node
    this.triggerEvent = (eventName, data) => {
      // Force best practice of having a single root element for components!
      if (this.firstNode !== this.lastNode) throw rootElementRequired();
      this.$(this.firstNode).trigger(eventName, data);
    };

    // Default values for props
    if (props) {
      this.props = {};
      this.autorun(() => {
        if (!props.validate) throw propertyValidatorRequired();
        let currentData = Template.currentData() || {};
        props.clean(currentData, propsCleanConfiguration);
        try {
          props.validate(currentData);
        } catch (error) {
          throw propertyValidationError(error, this.view.name);
        }
        for (let key of Object.keys(currentData)) {
          let value = currentData[key];
          if (!this.props[key]) {
            this.props[key] = generateReactiveAccessor(value);
          } else {
            this.props[key](value);
          }
        }
      });
    }
  });


  // Helpers
  if (!helpers) helpers = {};
  helpers.state = function() { return this.state; };
  helpers.props = function() { return this.props; };
  template.helpers(bindToTemplateInstance(helpers));

  // Events
  if (events) {
    template.events(bindToTemplateInstance(events));
  }

  // Lifecycle
  if (onCreated) template.onCreated(onCreated);
  if (onRendered) template.onRendered(onRendered);
  if (onDestroyed) template.onDestroyed(onDestroyed);

};

TemplateController.setPropsCleanConfiguration = (config) => {
  propsCleanConfiguration = config;
};
