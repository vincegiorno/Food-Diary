require.config({
  enforceDefine: true,
  paths: {
    backbone: 'libs/backbone-min',
    backboneCustom: 'app/backbone-custom',
    backfire: 'libs/backbonefire.min',
    bootstrap: 'libs/bootstrap-modal.min',
    firebase: 'libs/firebase-min',
    jquery: 'libs/jquery-min',
    underscore: 'libs/underscore-min',
    config: 'app/config',
    setup: 'app/setup'
  },
  map: {
    '*': {
      'backbone': 'backboneCustom'
    },
    'backboneCustom': {
      'backbone': 'backbone'
    }
  },
  shim: {
    'backbone': {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'bootstrap': {
      deps: ['jquery'],
      exports: '$.fn.modal'
    },
    'firebase': {
      exports: 'Firebase'
    },
    'backfire': {
      deps: ['backbone', 'firebase', 'underscore'],
      exports: 'Backbone'
    }
  }
});

define(['app/initialize'], function(initialize) {
  initialize();
});
