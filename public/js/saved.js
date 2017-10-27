$(document).ready(function() {  

  var thisID

//Upon accessing the Saved Articles page, a request for all articles that have been saved will be sent to the database.
//The saved articles will then be prepended to the article feed.
  $.getJSON("/articles/saved=true", function(data) {
    for (var i = 0; i < data.length; i++) {
      $("#savedArticles").prepend("<div class='panel panel-default'><div class='panel-heading'><a class='article-link' href="
        +data[i].link+"><h3>"+data[i].title+"</h3></a><a class='btn btn-danger delete' data-id="
        +data[i]._id+">Delete From Saved</a><a class='btn btn-success notes' data-id="
        +data[i]._id+">Article Notes</a></div><div class='panel-body'><p>"
        + data[i].summary+"</p></div></div>");
    }
  });

  $(document).on("click", ".delete", function() {
    var thisId = this.dataset.id;
      $.ajax({
      method: "POST",
      url: "/articles/deleted/" + thisId,
      data: {
        saved: false
      }
    }).done(function(data) {
       location.reload();
     });
  });

  $(document).on("click", ".notes", function() {
    thisId = this.dataset.id
    $("#notesHeading").text("Notes for Article: "+thisId)
    $.getJSON("/articles/notes/"+thisId, function(data) {
      console.log(data)
      if (data.note[0] !== undefined){
      $("#notesResult").append("<li class='list-group-item note'>"
        +data.note[0]+"<button class='btn btn-danger note-delete'>x</button></li>")
      } else {
      $("#notesResult").append("<li class='list-group-item note'>Notes have yet to be posted to this article.</li>")
      }
    });
    $("#notesModal").modal("toggle");
  });

  // When you click the savenote button
  $(document).on("click", ".save", function() {
    // Run a POST request to change the note, using what's entered in the inputs
    if ($("#bodyinput").val() !== ""){
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        body: $("#bodyinput").val()
      }
    })
      // With that done
      .done(function(data) {
        // Log the response, empty the modal, and toggle it away.
        console.log(data);
        $("#notesModal").modal("toggle");
      });
    } else {
      return false;
    }
  });

  $('#notesModal').on('hidden.bs.modal', function () {
  $("#bodyinput").val("");
  $("#notesResult").empty();
  });

});