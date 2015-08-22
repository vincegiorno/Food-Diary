$(function(){

var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}
    
var Totals = Backbone.Model.extend({
    defaults: function() {
      return {
        calories: 0,
        totFat: 0,
        satFat: 0,
        sodium: 0
      };
    }
});

var msgService = _.extend({}, Backbone.Events);
    
var totals = new Totals;

var TotalsView = Backbone.View.extend({
    
    el: '#totals-div',
    
    template: _.template($('#totals-template').html()),
    
    events: {
        'click #new-day-btn': 'newDay',
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
    
    newDay: function() {
        days.create({
            calories: this.model.calories,
            totFat: this.model.totFat,
            satFat: this.model.satFat,
            sodium: this.model.sodium,
            date: Date.now()
        })
        this.model.save( {
            calories: 0,
            totFat: 0,
            satFat: 0,
            sodium: 0
            
        });
        this.messages.trigger('changeDay', this.model);
    },
        
    searchOnEnter: function(e) {
      if (e.keyCode == 13) this.search();
    },
    
    search: function() {
        searchPhrase = $('#searchbox').val();
        if ($('#list-search').prop('checked')) {
            this.messages.trigger('searchList', searchPhrase);
        } else {
            
            
            
            
            this.messages.trigger('searchAPI', searchPhrase);
        }
    },
    
    updateTotals: function(data) {
        this.model.save({
            calories: calories + data.calories,
            totFat: totFat + data.totFat,
            satFat: satFat + data.satFat,
            sodium: sodium + data.sodium

        })
    }
});
    
var Days = Backbone.Firebase.Collection.extend({
    
    model: Totals,
    
    url: fbUrl + 'food-diary/' + id + '/days',
});

days = new Days;

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
        this.model.save({servings: servings + 1});
        this.messages.trigger('addServing', this.model);
    }
});
    
var FoodList = Backbone.Firebase.Collection.extend({
    
    model: Food,
    
    url: fbUrl + 'food-diary/' + id + '/food',
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