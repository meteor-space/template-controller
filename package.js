Package.describe({
  summary: 'Syntactic sugar for blaze templates',
  name: 'space:template-controller',
  version: '0.3.0',
  git: 'https://github.com/meteor-space/template-controller.git'
});

Package.onUse(function(api) {
  api.versionsFrom('2.11.0');

  api.use([
    'ecmascript',
    'reactive-var',
    'templating',
    'blaze-html-templates'
  ]);

  api.addFiles([
    'source/template-controller.js'
  ], 'client');

  api.export('TemplateController');

});
