define(["jquery","setup","views/appview","bootstrap"],function(e,a,t){function o(){var e=d.val(),a=/^\S+([\.-]?\S+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;if(!a.test(e))return i.removeClass("hidden"),void setTimeout(function(){i.addClass("hidden")},3e3);var t=encodeURIComponent(e).replace(/\./g,"%2E");try{localStorage.setItem("food-diary-id",t)}catch(o){console.log("Could not save ID in local storage")}t=encodeURIComponent(t).replace(/\./g,"%2E"),r.modal("hide"),n(t)}function n(e){try{appview=new t([],{id:e})}catch(o){a.alertGraph.text("Sorry, but the app was unable to start. Please check your Internet connection and try again, or try later."),a.alertGraph.addClass("alert alert-danger"),a.alertGraph.removeClass("hidden")}}var r=e("#sign-in"),d=e("#idBox"),i=e("#input-error"),l=function(){var a=localStorage.getItem("food-diary-id");a?(a=encodeURIComponent(a).replace(/\./g,"%2E"),n(a)):(r.modal({keyboard:!1}),r.modal("show"),e("#sign-in-button").click(o))};return l});