# TemplateController

**Syntactic sugar for Blaze templates**

Turn this (official Meteor 1.3 starting code):

```javascript
Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});
```

into that:

```javascript
TemplateController.create('hello', {

  state: {
    counter: 0
  },

  helpers: {
    counter() {
      return this.counter.get();
    }
  },

  events: {
    'click button'(event) {
      // increment the counter when button is clicked
      this.counter.set(this.counter.get() + 1);
    }
  }

});
```

### Table of Contents:
* [Installation](#installation)
* [Why](#why)
* [Api](#api)
* [Release History](#release-history)
* [License](#license)

## Installation
`meteor add space:template-controller`

## Api

## Release History
You can find the complete release history in the
[changelog](https://github.com/meteor-space/template-controller/blob/master/CHANGELOG.md)

## License
Licensed under the MIT license.
