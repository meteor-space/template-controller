Changelog
=========

## Next
- Fixed a bug with setting up template helpers for `state` and `props` if
no other helper was defined.
- Adds `templateInstance.triggerEvent(eventName, data)` sugar method to promote
the best practice of triggering custom events on the first template node like this:
`this.$(this.firstNode).trigger(eventName, data);`

## 0.1.0
Initial release