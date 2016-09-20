# TemplateController

**Supports the best practices of writing Blaze templates**

*Blaze is awesome* but writing the Js part of templates always
felt a bit awkward. This package just provides a very thin layer of syntactic
sugar on top of the standard API, so you can follow best practices outlined
in the [Blaze guide](http://guide.meteor.com/blaze.html#reusable-components)
more easily.

**Now you can turn this:**

```html
You have clicked the button {{counter}} times.
<button>click</button>
```

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

**into that:**

```html
You have clicked the button {{state.counter}} times.
<button>click</button>
```

```javascript
TemplateController('hello', {

  state: {
    counter: 0 // default value
  },

  events: {
    'click button'() {
      // increment the counter when button is clicked
      this.state.counter += 1;
    }
  }

});
```

Table of contents
-----------------

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [Configuration](#configuration)
* [Release History](#release-history)
* [Related Projects](#related-projects)
  * [Packages](#packages)
  * [Examples](#examples)
* [License](#license)

## Installation
`meteor add space:template-controller`

*Compatible with `Meteor 1.2.x - 1.3.x`*

## Usage

### `TemplateController(templateName, options)`

**templateName**

Just pass in the template name like you would access `Template.my_template`

**options**

The options are the same as with standard Blaze templates but
`TemplateController` supports best practices and common patterns.

*Here is a template with all possible options:*

```javascript
TemplateController('hello', {

  // Validate the properties passed to the template from parents
  props: new SimpleSchema({
    messageCount: {
      type: Number,
      defaultValue: 0
    }
  }),

  // Setup private reactive template state
  state: {
    counter: 0 // default value
  },

  // Lifecycle callbacks work exactly like with standard Blaze
  onCreated() {},
  onRendered() {},
  onDestroyed() {},

  // Helpers work like before but <this> is always the template instance!
  helpers: {
    someValue() {
      return this.data.someValue;
    }
  },

  // Events work like before but <this> is always the template instance!
  events: {
    'click button'(event, instance) {
      // this === instance
    }
  },

  // These are added to the template instance but not exposed to the html
  private: {
    someProperty: 5,
    someHelperFunction() {}
  }

});
```

## API

### `onCreated`, `onRenderd`, `onDestroyed`
work exactly the same as with standard Blaze.

### `events`, `helpers`
work exactly the same as normal but `this` inside the handlers is always
a reference to the `Template.instance()`. In most cases that's what you want
and would expect. You can still access the data context via `this.data`.

#### Accessing the Data Context of Child Templates
Sometimes you have child Blaze templates that trigger events but do not send the 
data context as event payload. Here is how you can always get a reference to
the data context of the template where the event originated from:

```javascript
events: {
  'click .from-child-template'(event) {
     const childDataContext = Blaze.getData(event.target);
     // do something with the data
  },
}
```

### `props: { clean: Function, validate: Function}`

Any data passed to your component should be validated to avoid UI bugs
that are hard to find. You can pass any object to the `props` option, which
provides a `clean` and `validate` function. `clean` is called first and can
be used to cleanup the data context before validating it (e.g: adding default
properties, transforming values etc.). `validate` is called directly after
and should throw validation errors if something does not conform the schema.
This api is compatible but not limited to
[SimpleSchema](https://github.com/aldeed/meteor-simple-schema).

This is a best practice outlined in the
[Blaze guide - validate data context](http://guide.meteor.com/blaze.html#validate-data-context)
section. `TemplateController` does provide a bit more functionality though:
Any property you define in the schema is turned into a template helper
that can be used as a reactive getter, also in the html template:

```javascript
TemplateController('message_count', {
  props: new SimpleSchema({
    messageCount: {
      type: Number, // allows only integers!
      defaultValue: 0
    }
  })
});
```

```html
<template name="message_count">
  You have {{props.messageCount}} messages.
</template>
```

… and you can access the value of `messageCount` anywhere in helpers etc. with
`this.props.messageCount`

a parent template can provide the `messageCount` prop with standard Blaze:
```html
<template name="parent">
  {{> message_count messageCount=unreadMessagesCount}}
</template>
```

If the parent passes down anything else than an integer value for `messageCount`
our component will throw a nice validation error.

### `state: { myProperty: defaultValue, … }`

Each state property you define is turned into a `ReactiveVar` and you can get
the value with `this.state.myProperty` and set it like a normal property
`this.state.myProperty = newValue`. The reason why we are not using
`ReactiveVar` directly is simple: we need a template helper to render it in
our html template! So `TemplateController` actually adds a `state` template
helper which returns `this.state` and thus you can render any state var in
your templates like this:

```html
You have clicked the button {{state.counter}} times.
```

But you can also modify the state var easily in your Js code like this:

```javascript
events: {
  'click button'() {
    this.state.counter += 1;
  }
}
```

Since each state var is turned into a separate reactive var you do not run
into any reactivity issues with re-rendering too much portions of your template.

### `private: { myProperty: …, myMethod: … }`

Any properties and methods you define on the `private` object will be added
to your template instance and are available anywhere. This way you can easily
define custom "private" helper methods to calculate or setup stuff. Do not
confuse these with "template helpers" though, they are not accessible from
the html template.

Here is a short and contrived example, but you get the point:

```javascript
TemplateController('hello', {

  // These are exposed to the html template!
  helpers: {
    someValueForTheHtmlTemplate() {
      // You can access the private helpers like this:
      return this.sum(this.myValue, 5);
    }
  },

  // These are just available on your template instance
  private: {
    myValue: 5,
    sum(first, second) {
      return first + second;
    }
  }
});
```

### `this.triggerEvent(eventName, data)`

Provides syntactic sugar to trigger a custom jQuery event on the `firstNode`
of your template. This equivalent to `this.$(this.firstNode).trigger(eventName, data)`. As you rarely need to (or
should) trigger custom events on sub-elements of the template we consider
this simple wrapper as best practice.

Another important difference is that you cannot pass multiple event arguments
like you can with the jQuery `trigger` api. We only allow a single argument
on purpose, to promote the best practice of avoiding argument lists.

Here is a simple example:

```javascript
TemplateController('hello', {
  events: {
    'click button'() {
      this.state.counter += 1;
      this.triggerEvent('counterIncremented', this.state.counter);
    }
  }
});
```

if you need to include more event data just pass an object with named
properties:

```javascript
this.triggerEvent('counterIncremented', {
  value: incrementedValue,
  timestamp: new Date()
});
```

In parent templates you can handle these custom events like this:

```javascript
TemplateController('some_parent_template', {
  events: {
    'counterIncremented'(event, instance, data) {
      // do something with the event
    }
  }
});
```

Notice in the example above that it is not necessary (and even discouraged)
to add a selector for the event handler (eg: `'counterIncremented .hello'`)!
The problem with this approach is that you are coupling the parent template
to the DOM structure and CSS classes of the child components while you are
just interested in the events. If you need to handle many different events
try to make the event names more specific like `helloCounterIncremented`
instead of general purpose events like `incremented` which could be published
by various components.

If you have multiple instance of the same reusable sub-component that you
need to manage, wrap each instance in a separate DOM element and add a
unique css class to the wrapper like this:

```html
<template name="some_parent_template">
  <div class="first-counter">{{> counter}}</div>
  <div class="second-counter">{{> counter}}</div>
  <div class="third-counter">{{> counter}}</div>
</template>
```

Then you can easily distinguish where the events come from by using selectors:

```javascript
TemplateController('some_parent_template', {
  events: {
    'counterIncremented .first-counter'() {},
    'counterIncremented .second-counter'() {},
    'counterIncremented .third-counter'() {}
  }
});
```
This way you are not coupling the controller code of `some_parent_template`
to the internal DOM of the `counter` template but keep the control where it
belongs! You can refactor and improve the `counter` template as you like now,
as long as you keep the API contract (events) intact!

#### Single Root Element for your template

`this.triggerEvent` only works if you defined a single root element for
your template like this:

```html
<template name="my_component">
  <div class="my-component">
    // other content
  </div>
</template>
```

This is also a best practice that we recommend to avoid strange bugs when
publishing jQuery events.

### Internal APIs

In some situations you might need more control over your templates and want
to use some of the internal helpers to reduce boilerplate even more.

#### Dynamically adding reactive properties to `state` and `props`

You can dynamically add new reactive properties to `props` and `state` in the `onCreated` hook:
```javascript
TemplateController('hello', {
  onCreated() {
    this.state.addProperty('counter', 0);
  }  
});
```
This opens up interesting meta-programming capabilities like passing in schemas
or models and generate state on the fly:

```javascript
TemplateController('hello', {
  props: new SimpleSchema({
    model: { type: Object, blackbox: true }
  }),
  onCreated() {
    // Generate named reactive properties on the fly
    this.state.addProperties(this.props.model);
  }
});
```


#### Binding Functions to `Template.instance()`
There are two internal helper functions, which can be used to bind any function
to run in the context of your template instance:
```javascript
// Bind a function to be bound to the Template.instance() -> returns new bound fn
let bound = TemplateController.bindToTemplateInstance(Function);
// Wrap all functions of the provided object -> updates object methods in-place!
TemplateController.bindAllToTemplateInstance({ key: Function, ... });
```

## Configuration

### `TemplateController.setPropsCleanConfiguration(Object)`
Enables you to configure the props cleaning operation of libs like SimpleSchema. Checkout [SimpleSchema clean docs](https://github.com/aldeed/meteor-simple-schema#cleaning-data) to
see your options.

Here is one example why `removeEmptyStrings: true` is the default config:

```handlebars
{{> button label=(i18n 'button_label') }}
```
`i18n` might initially return an empty string for your translation.
This would cause an validation error because SimpleSchema removes empty strings by default when cleaning the data.

## Release History
You can find the complete release history in the
[changelog](https://github.com/meteor-space/template-controller/blob/master/CHANGELOG.md)

## Related Projects

### Packages

* [TemplateTwoWayBinding](https://github.com/comerc/meteor-template-two-way-binding) Two-Way Binding for Blaze templates with support for `TemplateController`.
* [TemplateControllerModelMap](https://github.com/comerc/meteor-template-controller-model-map) Validate template state.
* [Blaze Magic Events](https://github.com/themeteorites/blaze-magic-events) was confirmed by @comerc to work with `TemplateController`.

### Examples

* [Demo: template-controller + two-way-binding + model-map](https://github.com/comerc/meteor-template-controller-demo) by @comerc.

## License
Licensed under the MIT license.
