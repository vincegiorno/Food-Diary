define(['jquery', 'backbone', 'setup', 'models/food', 'views/food-view'], function($, Backbone, app, Food, FoodView) {

  // Set up view to display results from online database
  var ApiResultsView = Backbone.View.extend({

    tagName: 'tbody',

    // Results from API call passed in as @params.results
    initialize: function(params) {
      app.title.html('Add to Today');
      app.whichList = 'apiResults';
      this.results = params.results;
      // Remove view if a different or new API results list will be displayed
      this.listenTo(app.messages, 'closeList', this.close);
      this.render();
      // Set last field header
      app.optionHead.text('+');
    },

    render: function() {
      var view, food, fields;
      // Build food models from returned results
      for (var i = 0; i < this.results.length; i++) {
        fields = this.results[i].fields;
        food = new Food({
          itemId: fields.item_id,
          item: fields.item_name,
          brand: fields.brand_name,
          calories: fields.nf_calories,
          totFat: fields.nf_total_fat,
          satFat: fields.nf_saturated_fat,
          sodium: fields.nf_sodium,
          servings: 1
        });
        // Build a foodView for each model
        view = new FoodView({
          model: food
        });
        // Final column has the 'Add' option
        view.$('.option').text('Add');
        // Build HTML in default div to avoid separate renders for each food
        this.$el.append(view.$el);
      }
      this.$('.delete').css('visibility', 'hidden');
      // Insert into DOM with one draw
      app.foodTable.append(this.$el);
      app.done.removeClass('hidden');
    }
  });
  return ApiResultsView;
});
