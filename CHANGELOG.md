Changelog
=========

## 0.3.0

### Breaking Changes:
Introduces getters and setters for `props` and `state` properties, so now you
have to access them like real properties on an object instead of calling a
function. Now you can write this
```javascript
events: {
  'click button'() {
    // increment the counter when button is clicked
    this.state.counter += 1;
  }
}
```
  instead of
```javascript
events: {
  'click button'() {
    // increment the counter when button is clicked
    this.state.counter(this.state.counter() + 1);
  }
}
```
which will greatly simplify your template code :)
[see full example](https://github.com/meteor-space/template-controller/blob/master/README.md#templatecontroller)

### New Features:

#### Dynamically adding reactive properties to `state` and `props`
You can dynamically add new reactive properties to `props` and `state` like this:
```javascript
this.state.addProperty(key, defaultValue);
this.state.addProperties({ key: value, ... }); // multiple at once:
```
[checkout the docs](https://github.com/meteor-space/template-controller/blob/master/README.md#dynamically-adding-reactive-properties-to-state-and-props)

#### Use internal helpers
There are two internal helper functions now exposed on the api, which can be
useful to re-use in certain situations:
```javascript
// Wrap a function to be bound to the Template.instance()
TemplateController.bindToTemplateInstance(Function);
// Wrap all functions of the provided object
TemplateController.bindAllToTemplateInstance({ key: Function, ... });
```

## 0.2.3
- Make it possible to configure the props cleaning operation of libs like SimpleSchema.

## 0.2.2
- Fixes weird ecmascript errors in Meteor 1.2.x

## 0.2.1
- improves error messages and fixes #6
- Adds section about using a single root element to readme

## 0.2.0
- @Craphtex fixed a bug with setting up template helpers for `state` and `props`
if no other helper was defined.
- Adds `templateInstance.triggerEvent(eventName, data)` sugar method to promote
the best practice of triggering custom events on the first template node like
this: `this.$(this.firstNode).trigger(eventName, data);`

## 0.1.0
Initial release
