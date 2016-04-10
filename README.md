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
      this.state.counter(this.state.counter() + 1);
    }
  }

});
```

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
[Blaze guide - validate data context](https://github.com/aldeed/meteor-simple-schema)
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
`this.props.messageCount()`

a parent template can provide the `messageCount` prop with standard Blaze:
```html
<template name="parent">
  {{> message_count messageCount=unreadMessagesCount}}
</template>
```

If the parent passes down anything else than an integer value for `messageCount`
our component will throw a nice validation error.

### `state: { myProperty: defaultValue, … }`

Each state property you define is turned into a `ReactiveVar` and wrapped into
an accessor function, available via `this.state.myProperty()` as getter and
`this.state.myProperty(newValue)` as setter. The reason why we are not using
`ReactiveVar` directly is simple: we need a template helper to render it in
our html template! So `TemplateController` actually adds a `state` template
helper which returns `this.state` and thus you can render any state var in
your templates like this:

```html
You have clicked the button {{state.counter}} times.
```

But you can also set the state var easily in your Js code like this:

```javascript
events: {
  'click button'() {
    let incrementedValue = this.state.counter() + 1;
    this.state.counter(incrementedValue);
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

## Release History
You can find the complete release history in the
[changelog](https://github.com/meteor-space/template-controller/blob/master/CHANGELOG.md)

## License
Licensed under the MIT license.
