define(['backbone'], function(Backbone) {

  Backbone.View.prototype.close = function() {
    this.undelegateEvents();
    this.remove();
  };

  return Backbone;
});
