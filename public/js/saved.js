$(document).ready(function() {  

  var thisID

//Upon accessing the Saved Articles page, a request for all articles that have been saved will be sent to the database.
//The saved articles will then be prepended to the article feed.
  $.getJSON("/articles/saved=true", function(data) {
    for (var i = 0; i < data.length; i++) {
      $("#savedArticles").prepend("<div class='panel panel-default'><div class='panel-heading'><a target='_blank' class='article-link' href="
        +data[i].link+"><h3>"+data[i].title+"</h3></a><a class='btn btn-danger delete' data-id="
        +data[i]._id+">Delete From Saved</a><a class='btn btn-success notes' data-id="
        +data[i]._id+">Article Notes</a></div><div class='panel-body'><p>"
        + data[i].summary+"</p></div></div>");
    }
  });

//Should a user delete an article from the saved articles page, it will switch the boolean value and remove all associated
//notes from the article. It will likely be pulled again on the next scrape on the main page however.
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

//Should a user click the Article Notes button, a modal will be toggled displaying any notes, if there any have been saved
//by any user, and a text area to allow the user to save their own notes. If no notes have been posted, a message
//informing the user of that will be displayed instead.
  $(document).on("click", ".notes", function() {
    thisId = this.dataset.id
    $("#notesHeading").text("Notes for Article: "+thisId)
    $.getJSON("/articles/notes/"+thisId, function(data) {
      if (data.note[0] !== undefined){
        for (i=0;i<data.note.length;i++){
        $.getJSON("/notes/saved/"+data.note[i], function(data){
          if (data[0] !== undefined){
            $("#notesResult").append("<li class='list-group-item note'>"
          +data[0].body+"<button class='btn btn-danger note-delete' data-id='"+data[0]._id+"'>x</button></li>")
            }
          })
        };
      } else {
      $("#notesResult").append("<li class='list-group-item note'>No notes have been posted to this article.</li>")
      }
    });
    $("#notesModal").modal("toggle");
  });

  // When the Save button is clicked, the value in the text area will be used to save a note and associate it with the
  // article whose modal is active.
  $(document).on("click", ".save", function() {
    
    if ($("#bodyinput").val() !== ""){
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        body: $("#bodyinput").val()
      }
    }) 
      .done(function(data) {  
        console.log(data);
        $("#notesModal").modal("toggle");
      });
    } else {
      return false;
    }
  });

  // If a user clicks to delete a note, the note is deleted from the database.
    $(document).on("click", ".note-delete", function() {
    var thisNoteId = this.dataset.id;
      $.ajax({
      method: "POST",
      url: "/notes/delete/" + thisNoteId
    }).done(function(data) {
       $("#notesModal").modal("toggle");
     });
  });

  // Upon the modal toggling off/away, the textarea and notes fields are emptied to prevent unintended stacking/overlap 
  // of old notes.
  $('#notesModal').on('hidden.bs.modal', function () {
  $("#bodyinput").val("");
  $("#notesResult").empty();
  });

});