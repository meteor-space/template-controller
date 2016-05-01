const DEFAULT_API = [
  'state', 'props', 'helpers', 'events', 'onCreated', 'onRendered', 'onDestroyed'
];

class ReactiveObject {
  constructor(properties = {}) {
    this.addProperties(properties);
  }
  addProperty(key, defaultValue = null) {
    const property = new ReactiveVar(defaultValue);
    Object.defineProperty(this, key, {
      get: () => { return property.get(); },
      set: (value) => { property.set(value); }
    });
  }
  addProperties(properties = {}) {
    for (let key of Object.keys(properties)) {
      this.addProperty(key, properties[key]);
    }
  }
}

// Helpers
const bindToTemplateInstance = function(handler) {
  return function() {
    return handler.apply(Template.instance(), arguments);
  };
};

const bindAllToTemplateInstance = function(handlers) {
  for (let key of Object.keys(handlers)) {
    handlers[key] = bindToTemplateInstance(handlers[key]);
  }
  return handlers;
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
    this.state = new ReactiveObject(state);
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

    // Setup validated reactive props passed from the outside
    this.props = new ReactiveObject();
    if (props) {
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
          if (!this.props.hasOwnProperty(key)) {
            this.props.addProperty(key, value);
          } else {
            this.props[key] = value;
          }
        }
      });
    }
  });


  // Helpers
  if (!helpers) helpers = {};
  helpers.state = function() { return this.state; };
  helpers.props = function() { return this.props; };
  template.helpers(bindAllToTemplateInstance(helpers));

  // Events
  if (events) {
    template.events(bindAllToTemplateInstance(events));
  }

  // Lifecycle
  if (onCreated) template.onCreated(onCreated);
  if (onRendered) template.onRendered(onRendered);
  if (onDestroyed) template.onDestroyed(onDestroyed);

};

TemplateController.setPropsCleanConfiguration = (config) => {
  propsCleanConfiguration = config;
};

TemplateController.bindToTemplateInstance = bindToTemplateInstance;
TemplateController.bindAllToTemplateInstance = bindAllToTemplateInstance;
