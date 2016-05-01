Changelog
=========

## Next

### Breaking Changes:
- Introduces getters and setters for `props` and `state` properties, so now you
  have to access them like real properties on an object instead of calling a
  function. Now you have to do this
  ```javascript
  this.state.counter += 1;
  ```
  instead of
  ```javascript
  this.state.counter(this.state.counter() + 1);
  ```
### New Features:
- You can dynamically add new reactive properties to `props` and `state` like this:
  ```javascript
  this.state.addProperty(key, defaultValue);
  ```
  or multiple at once:
  ```javascript
  this.state.addProperties({ key: value, ... });
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