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

var msgService = _.extend({}, Backbone.Events);
    
var totals = new Totals;

var TotalsView = Backbone.View.extend({
    
    el: '#totals-div',
    
    template: _.template($('#totals-template').html()),
    
    events: {
        'click #search-btn': 'search',
        'keypress': 'searchOnEnter'  
    },
    
    initialize: function(params){
        this.messages = params.messages;
        this.render();   
        this.listenTo(this.model, 'change', this.render);
  		this.messages.on("addFood", this.updateTotals, this);
  		this.messages.on("addServing", this.updateTotals, this);
    },
    
    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        return this;
    },
        
    searchOnEnter: function(e) {
      if (e.keyCode == 13) this.search();
    },
    
    search: function() {
        //TODO: add search functionality, message on API success
        //TODO: message on Food List call -> .where(item contains string), set false flag in case no hits
    }
});
    
var Days = Backbone.Collection.extend({
    
    model: Totals,
    
    localStorage: new Backbone.LocalStorage("food-diary-days"),
})

var Food = Backbone.Model.extend({
    defaults: function() {
      return {
          servings: 1,
          today: true
      };
    }
});
    
var FoodView = Backbone.View.extend({
    tagName: 'tr',
    
    template: _.template($('#food-template').html()),
    
    events: {
        'click .option': 'addIfLink',
        'dblclick .option': 'incrementServings'
    },
    
    initialize: function() {
        this.messages = params.messages;
        this.render();
        this.listenTo(this.model, 'change', this.render);
        
    },
    
    addIfLink: function() {
       if (this.$('.option').html() === 'Add today') {
           this.messages.trigger('addFood', this.model);
       }
    },
    
    incrementServings: function() {
        var newServings = this.get('servings') + 1;
        this.set({servings: newServings});
        this.messages.trigger('addServing', this.model);
    }
});
    
var FoodList = Backbone.Collection.extend({
    
    model: Food,
    
    localStorage: new Backbone.LocalStorage("food-diary-foods"),
//TODO:  local storage 
});

var FoodListView = Backbone.View.extend({
//TODO: remove on search().success    
});  

var ResultsList = Backbone.Collection.extend({
    
});
    
var SearchResultsView = Backbone.View.extend({
 //TODO: Done button; hidden in FoodListView, remove on Done   
});  

var totalsView = new TotalsView({model: totals}, {messages: msgService});
        
});