Package.describe({
  summary: 'Syntactic sugar for blaze templates',
  name: 'space:template-controller',
  version: '0.1.0',
  git: 'https://github.com/meteor-space/template-controller.git'
});

Package.onUse(function(api) {

  api.versionsFrom('1.3');

  api.use([
    'modules',
    'ecmascript',
    'reactive-var',
    'templating',
    'blaze-html-templates'
  ]);

  api.mainModule("source/template-controller.js", "client");
  api.export("TemplateController");

});
