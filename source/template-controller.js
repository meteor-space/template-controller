import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import ExtendableError from 'es6-error';

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

// Errors
class TemplateNotFoundError extends ExtendableError {
  constructor(templateName) {
    super(`No template <${templateName}> found.`);
  }
}

const TemplateController = {

  create(templateName, config) {
    // Template reference
    let template = Template[templateName];
    if (!template) {
      throw new TemplateNotFoundError(templateName);
    }
    let { state, helpers, events, onCreated, onRendered, onDestroyed} = config;
    // State
    if (state) {
      template.onCreated(function() {
        for (let key of Object.keys(state)) {
          this[key] = new ReactiveVar(state[key]);
        }
      });
    }
    // Helpers
    if (helpers) {
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
  }

};

export default TemplateController;
