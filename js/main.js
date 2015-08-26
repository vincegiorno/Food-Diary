$(function(){

var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}

var searching = $('#searching'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('#option-head'),
    placeholder = $('#placeholder');
    messages = _.extend({}, Backbone.Events);

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
    
    initialize: function(params) {
        this.model = params.model;
        this.messages = params.messages;
        this.render();   
        this.listenTo(this.model, 'change', this.render);
  		this.messages.on("addFood", this.updateTotals, this);
  		this.messages.on("addServing", this.updateTotals, this);
    },
    
    events: {
        'click #new-day': 'newDay',
        'click #search-btn': 'search',
        //'keypress': 'searchOnEnter',
        'click #show-list': 'showListMessage'
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
        return false;
    },
        
    /*searchOnEnter: function(e) {
      if (e.keyCode == 13) this.search();
    },*/
    
    search: function() {
        searchPhrase = $('#searchbox').val();
        if ($('#list-search').prop('checked')) {
            this.messages.trigger('searchList', searchPhrase);
        } else {
            this.searchAPI(searchPhrase);
        }
        return false;
    },
    
    searchAPI: function(phrase) {
        var self = this,
            searchWords = escape(phrase);
        var queryUrl = ntrxUrl + searchWords;
        searching.html('Searching...');
        $.getJSON(queryUrl,ntrxParams)
            .done(function(result) {
                var results = result.hits;
                self.messages.trigger('successAPI');
                apiResultsView = new ApiResultsView({results: results, messages: self.messages});
        })
            .fail(function() {
            searching.html('Search request failed. Please check your Internet connection and try again');
        });
    },
    
    showListMessage: function() {
        this.messages.trigger('showMyList');
        return false;
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
    
var totalsView = new TotalsView({model: totals, messages: messages});
        
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
    
    initialize: function(params) {
        this.model = params.model;
        this.messages = params.messages;
        this.render();
    },
    
    events: {
        'click .option': 'addIfLink',
        'dblclick .option': 'incrementServings'
    },
    
    render: function(optionAdd) {
        this.$el.html(this.template(this.model));
        return this;
    },
    
    addIfLink: function() {
       if (this.$('.option').html() === 'Add') {
           this.messages.trigger('addFood', this.model);
       }
        return false;
    },
    
    incrementServings: function() {
        var newServings = parseInt(this.model.get('servings') + 1);
        this.model.save({servings: newServings});
        this.messages.trigger('addServing', this.model);
        return false;
    }
});
    
    
var FoodList = Backbone.Firebase.Collection.extend({
    
    model: Food,
    
    url: fbUrl + 'food-diary/' + id + '/food',
});
    
var foodList = new FoodList;

var FoodListView = Backbone.View.extend({
    
    initialize: function(params) {
        this.foodList = params.foodList;
        this.messages = params.messages;
        this.showToday();
        this.listenTo(this.messages, 'searchList', this.showResults);
        this.listenTo(this.messages, 'successAPI', this.remove);
        this.listenTo(this.messages, 'addFood', this.addFood);
        this.listenTo(this.messages, 'showMyList', this.showAll);
    },
    
    events: {
        'click #done': 'showToday'
    },
    
    render: function(optionAdd) {
        var view;
        foodList.each(function(food) {
            view = new FoodView({model: food, messages: messages});
            if (!food.model.get('show')) {
                view.$el.addClass('hidden');
            } else {
                if (optionAdd) {
                    this.$('.option').html('Add');
                }
            }
            view.$el.appendTo($('#food-table'));
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
        return false;
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
        optionHead.html('Add today');
        foodList.each(function(food) {
            food.model.set({show: true});
        });
        this.render(true);
    },
    
    addFood: function(food) {
        food.set({today: true});
        this.showToday;
        return false;
    }        
});
        
var foodListView = new FoodListView({foodList: foodList, messages: messages});

var ApiResultsView = Backbone.View.extend({
            
    initialize: function(params) {
        title.html('Add any of these to Today\'s Foods');
        this.results = params.results;
        this.messages = params.messages;
        this.listenTo(this.messages, 'addFood', this.addFood);
        this.render();
        optionHead.html('Add today');
    },
    
    events: {
        'click #done': 'switchView'
    },
    
    render: function() {
        var view, fields;
        for (var i = 0; i < this.results.length; i++) {
            fields = this.results[i].fields;
            view = new FoodView({model: {
                itemId: fields.item_id,
                item: fields.item_name,
                brand: fields.brand_name,
                calories: fields.nf_calories,
                totFat: fields.nf_total_fat,
                satFat: fields.nf_saturated_fat,
                sodium: fields.nf_sodium,
                servings: 1
            }, messages: messages});
            view.$('.option').html('Add');
            this.$el.append(view.$el);
        }
        placeholder.replaceWith(this.$el.html());
        done.removeClass('hidden');
    },
    
    switchView: function() {
        console.log('switchView called');
        this.remove();
        foodListView = new FoodListView;
        return false;
    },
    
    addFood: function(food) {
        var found = foodList.findWhere({itemId: food.get('itemId')});
        if (found) {
            return;
        } else {
            foodList.create(food);
        }
    }
});

var apiResultsView; // only initialized on search
        
});