define(['jquery', 'backbone', 'underscore'], function($, Backbone, _) {

  // Cache jQuery objects; create messages object, state variable
  var app = {
    totalsDiv: $('#totals-div'),
    searchBox: $('#searchbox'),
    searchDbase: $('#search-dbase'),
    listBtn: $('#show-list'),
    graphDiv: $('#graph-div'),
    alertGraph: $('#alert-graph'),
    graphBtn: $('#graph-btn'),
    title: $('#table-title'),
    done: $('#done'),
    optionHead: $('#option-head'),
    foodTable: $('#food-table'),
    messages: _.extend({}, Backbone.Events), // message bus
    whichList: '' // keeps track of which list is being displayed
  };
  return app;
});
