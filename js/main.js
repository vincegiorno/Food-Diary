$(function(){

var Totals = Backbone.Model.extend({
    defaults: function() {
      return {
        calories: 0,
        sodium: 0,
        totFat: 0,
        satFat: 0
      };
    }
});

var totals = new Totals

var TotalsView = Backbone.View.extend({
    el: '#table-div',
    template: _.template($('#totals-template').html()),
    events: {
        'click #search-btn': 'search',
        'keypress': 'searchOnEnter'  
    },
    initialize: function(){
        this.render();   
        this.listenTo(this.model, 'change', this.render);
    },
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.search();
    },
    search: function() {
        console.log('search called');
    }
});

var Food = Backbone.Model.extend({
    defaults: function() {
      return {
          servings: 1
      };
  },
    
    changeServings: function(num) {
        this.set({servings: num});
    }
});
    
var FoodListView = Backbone.View.extend({
    el: '#my-list-div'
});


var totalsView = new TotalsView({model: totals});
    
var msgService = _.extend({}, Backbone.Events);
    
});