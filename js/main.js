

var Totals = Backbone.Model.extend ({
    defaults: function() {
      return {
        calories: 0,
        sodium: 0,
        fat: 0,
        satFat: 0
      };
    }
});

var totals = new Totals

var TotalsView = Backbone.View.extend ({
    el: '#table-div',
    template: _.template($('#totals-template').html()),
    events: {
        
    }
    initialize: function(){
        this.render;
    }
});




var totalsView = new TotalsView({model: totals});