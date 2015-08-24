$(function(){

var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}

var searching = $('#searching'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('option-head'),
    msgService = _.extend({}, Backbone.Events);

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

    
var totals = new Totals;

var TotalsView = Backbone.View.extend({
    
    el: '#totals-div',
    
    template: _.template($('#totals-template').html()),
    
    events: {
        'click #new-day': 'newDay',
        'click #search-btn': 'search',
        'keypress': 'searchOnEnter',
        'click show-list': this.messages.trigger('showMy List')
    },
    
    initialize: function(params) {
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
            searchAPI(searchPhrase);
        }
    },
    
    searchAPI: function(phrase) {
        var self = this,
            searchWords = escape(phrase);
        var queryUrl = ntrxUrl + searchWords;
        searching.text('Searching...');
        $.getJSON(queryUrl,ntrxParams)
            .done(function(result) {
                var results = result.hits;
                self.messages.trigger('successAPI');
                apiResultsView = new ApiResultsView({model: results, messages: self.messages});
        })
            .fail(function() {
            searching.html
        })
    },
    
    updateTotals: function(data) {
        this.model.save({
            calories: this.model.get('calories') + data.get('calories'),
            totFat: this.model.get('totFat') + data.get('totFat'),
            satFat: this.model.get('satFat') + data.get('satFat'),
            sodium: this.model.get('sodium') + data.get('sodium')

        })
    }
});
    
var totalsView = new TotalsView({model: totals}, {messages: msgService});
    
var Days = Backbone.Firebase.Collection.extend({
    
    model: Totals,
    
    url: fbUrl + 'food-diary/' + id + '/days',
});

var days = new Days;

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
    
    render: function(optionAdd) {
        this.$el.html(this.template(this.model.toJSON()));
        if (optionAdd) {
            this.$('.option').html('Add');
        }
        return this;
    },
    
    addIfLink: function() {
       if (this.$('.option').html() === 'Add') {
           this.messages.trigger('addFood', this.model);
       }
    },
    
    incrementServings: function() {
        this.model.save({servings: parseInt(this.model.get('servings') + 1});
        this.messages.trigger('addServing', this.model);
    }
});
    
    
var FoodList = Backbone.Firebase.Collection.extend({
    
    model: Food,
    
    url: fbUrl + 'food-diary/' + id + '/food',
});
    
var foodList = new FoodList;

var FoodListView = Backbone.View.extend({
    
    events: {
        'click #done': 'showToday'
    },
    
    initialize: function() {
        this.messages = params.messages;
        this.showToday();
        this.listenTo(this.messages, 'searchList', this.showResults);
        this.listenTo(this.messages, 'successAPI', this.remove);
        this.listenTo(this.messages, 'showAll', this.showAll);
        this.listenTo(this.messages, 'addFood', this.addFood);
        this.listenTo(this.messages, 'showMyList', this.showAll);
    },
    
    render: function(optionAdd) {
        var view;
        foodList.each(function(food) {
            view = new FoodView({model: food});
            if (!food.model.get('show')) {
                view.$el.addClass('hidden');
            }
            view.render(optionAdd).$el.appendTo($('#food-table'));
        });
    },
    
    showToday: function() {
        title.html('Today\'s Food');
        optionHead.html('Servings');
        done.addClass('hidden');
        foodList.each(function(food) {
            if (food.model.get('today')) {
                food.model.set({show: true});
            }
        });
        this.render();
    },
    
    showResults: function(phrase) {
        var words = phrase.split(' '),
            count = 0;
        foodlist.each(function(food) {
            var showThis = true;
            var item = food.model.get('item');
            for (var i = words.length; i; i--) {
                if (item.indexOf(words[i]) < 0) {
                    showThis = false;
                    break;
                }
            }
            food.model.set({show: showThis});
            food.model.set({servings: 'Add today'});
            count += 1;
        });
        if (count) {
            title.html('Foods found on my list');
            optionHead.html('Add today');
            done.removeClass('hidden');
        } else {
            title.html('try again or search the database');
        }
        this.render(true);
    },
    
    showAll: function() {
        if (title.html() === 'My Food List') {
            return;
        }
        title.html('My Food List');
        foodList.each(function(food) {
            food.model.set({show; true});
        });
        this.render(true);
    },
    
    addFood: function(food) {
        food.set({today: true});
        this.showToday;
    }        
});
        
var foodListView = new FoodListView;

var ApiResultsView = Backbone.View.extend({
    
    found: null;
    
    template
    
    events: {
        'click #done': 'switchView'
    },
    
    initialize: function(params) {
        this.model = params.model;
        this.messages = params.messages;
        this.listenTo(this.messages, 'addFood', this.addFood);
        this.render();
        optionHead.html('Add today');
    },
    
    render: function() {
        var view;
        this.model.each(function(item) {
            view = new FoodView({
                itemId: newFood.item_id,
                item: newFood.item_name,
                calories: newFood.nf_calories,
                totFat: newFood.nf_total_fat,
                satFat: newFood.nf_saturated_fat,
                sodium: newFood.nf_sodium,
            });
            view.render(true).$el.appendTo($('#food-table'));
        });
    },
    
    switchView: function() {
        this.remove();
        foodListView = new FoodListView;
    },
    
    addFood: function(food) {
        this.found = foodList.findWhere({itemId: food.get('id')});
        if (found) {
            return;
        } else {
            foodList.create(food);
        }
    }
});

var apiResultsView; // only initialized on search
        
});