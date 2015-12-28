describe(['backbone', 'setup', 'jquery'], function(Backbone, app) {

  // Draw a graph showing total calories for previous days, up to 14 days
  var Graph = Backbone.View.extend({

    el: '#graph',

    initialize: function() {
      // Draw a new graph when a new day is added to the collection
      this.listenTo(this.collection, 'add', this.render);
      this.ctx = this.el.getContext('2d');
      // Draw initial graph when the app starts
      this.render();
    },

    render: function() {
      var xPadding = 30,
        yPadding = 20,
        yMax = 0,
        yMin = 20000,
        xScale,
        yScale,
        yInterval,
        points,
        data = [],
        count,
        width,
        height,
        ctx = this.ctx;
      app.graphDiv.removeClass('hidden'); // In case 'hidden' was set previously
      // Set width dynamically
      width = this.el.width = app.graphDiv.width() - 5;
      // Compress graph on small screens
      if (window.screen.width < 700) {
        this.el.height = 170;
        //yPadding = 10;
        ySteps = 5;
      } else {
        this.el.height = 280;
        ySteps = 10;
      }
      height = this.el.height - 20; // leave room for x-axis label
      ctx.clearRect(0, 0, width, height);
      // Get all previous saved days
      points = this.collection.filter(function(day) {
        return day.get('date') !== 0;
      });
      // Don't graph if less than 2 points
      if (points.length < 2) {
        this.graphAlert();
        return;
      }
      // Limit the days to no more than 14
      if (points.length > 14) {
        points = points.slice(points.length - 14);
      }
      // Extract total calories from each day, find min and max values
      count = points.length;
      for (var i = 0; i < count; i++) {
        var y = data[i] = points[i].get('calories');
        yMin = y < yMin ? y : yMin;
        yMax = y > yMax ? y : yMax;
      }
      // Don't graph, show message if totals all 0
      if (yMax === 0) {
        this.graphAlert();
        return;
      }
      // Round yMin down and yMax up to nearest 100
      yMin -= yMin % 100 + 100;
      yMin = yMin < 0 ? 0 : yMin; // Avoid a negative value
      yMax += 100 - yMax % 100;
      // Set graph parameters
      yScale = (height - yPadding) / (yMax - yMin);
      yInterval = (yMax - yMin) / (ySteps);
      xScale = (width - xPadding - 5) / (count - 1);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw y and then x axis //
      ctx.moveTo(xPadding, yPadding);
      ctx.lineTo(xPadding, height);
      ctx.lineTo(width, height);
      ctx.stroke();
      // Fill in y-axis interval labels
      ctx.textBaseline = 'middle';
      for (i = 0; i <= ySteps; i++) {
        ctx.fillText(yMax - i * yInterval, 0, (yPadding + (i * height / (ySteps + 1))));
      }
      // Add x-axis label
      ctx.textBaseline = top;
      ctx.fillText('Calorie totals for the last ' + count + ' days', 60, height + 10);
      // Plot line graph
      ctx.beginPath();
      ctx.strokeStyle = '#337ab7';
      ctx.moveTo(xPadding, height - (data[0] - yMin) * yScale);
      for (i = 1; i < count; i++) {
        ctx.lineTo(xPadding + xScale * i, height - (data[i] - yMin) * yScale);
      }
      ctx.stroke();
      // Plot data points
      for (i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(xPadding + xScale * i, height - (data[i] - yMin) * yScale, 2, 0, 2 * Math.PI, true);
        ctx.fill();
      }
      // Show button to hide graph on small screens in portrait
      if (window.screen.width < 400) {
        app.graphBtn.removeClass('hidden');
      } else {
        app.graphBtn.addClass('hidden');
      }
    },

    // If graph cannot be drawn, display message briefly then hide graph div
    graphAlert: function() {
      app.alertGraph.removeClass('hidden');
      setTimeout(function() {
        app.alertGraph.addClass('hidden');
        app.graphDiv.addClass('hidden');
      }, 3000);
    }
  });
  
  return Graph;
});
