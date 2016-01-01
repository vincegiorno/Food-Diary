define(['jquery', 'setup', 'views/appView', 'bootstrap'], function($, app, AppView) {

  var signIn = $('#sign-in'),
    idBox = $('#idBox'),
    inputError = $('#input-error');

  var initialize = function() {
    var id = localStorage.getItem('food-diary-id');
    // id will be used to access the proper Firebase data
    if (id) {
      /* Firebase addresses are URLs, so illegal characters must be replaced. For
      some reason, this must be done twice or Firebase throws an error. The user
      input string is encoded before being put in local storage. It is encoded
      a second time here. */
      id = encodeURIComponent(id).replace(/\./g, '%2E');
      startUp(id);
    } else {
      signIn.modal({
        // Prevent user from dismissing modal so they must enter id
        keyboard: false
      });
      signIn.modal('show');
      $('#sign-in-button').click(processId); // Activate 'Submit' button
    }
  };

  // Handle string user inputs in modal textbox
  function processId() {
    var userInput = idBox.val();
    // Check for valid email format
    var checkString = /^\S+([\.-]?\S+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    // If invalid, display warning. Modal stays open until valid string entered.
    if (!checkString.test(userInput)) {
      inputError.removeClass('hidden');
      setTimeout(function() {
        inputError.addClass('hidden');
      }, 3000);
      return;
    } else {
      // Encode valid input to remove illegal characters & put in local storage
      var id = encodeURIComponent(userInput).replace(/\./g, '%2E');
      localStorage.setItem('food-diary-id', id);
      // Encode again so Firebase doesn't throw error
      id = encodeURIComponent(id).replace(/\./g, '%2E');
      // Hide the modal and start the app
      signIn.modal('hide');
      startUp(id);
    }
  }

  // Sets up the app as an instance of AppView, or displays an error message
  function startUp(id) {
    try {
      appview = new AppView([], {
        id: id
      });
    } catch (e) { // Replaces the alert text used when a graph cannot be diplayed, adds red background
      app.alertGraph.text('Sorry, but the app was unable to start. Please check your Internet connection ' +
        'and try again, or try later.');
      app.alertGraph.addClass('alert alert-danger');
      app.alertGraph.removeClass('hidden');
    }
  }

  return initialize;
});
