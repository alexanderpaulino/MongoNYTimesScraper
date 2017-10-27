var db = require("../models");
var axios = require("axios");
var cheerio = require("cheerio");
var ObjectId = require('mongoose').Types.ObjectId

module.exports = function(app) {  
  app.get("/scrape", function(req, res) {

    axios.get("https://www.nytimes.com").then(function(response) {
  
      var $ = cheerio.load(response.data);

      $("article.story").each(function(i, element) {
        
        var result = {};

        result.title = $(this)
          .children("h2.story-heading")
          .children("a")
          .text();
        result.link = $(this)
          .children("h2.story-heading")
          .children("a")
          .attr("href");
        result.summary = $(this)
          .children("p.summary")
          .text();

        db.Article
          .create(result)
          .then(function(dbArticle) {  
          res.send("Scrape Complete");
          }).catch(function(err) {
            // **Take the code below, it prevents unhandled promise rejections from stacking up with every scrape.**
            if (err) {
            return res.send();
            }
            res.json("Scrape Complete with errors");
          });
        });
    });
  });

  // Route for getting all Articles from the collection
  app.get("/articles", function(req, res) {
    db.Article
      .find({})
      .then(function(dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for getting all Articles from the collection that have not been saved
  app.get("/articles/saved=false", function(req, res) {
    db.Article
      .find({saved: {$ne: true}})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

  // Route for getting all Articles from the collection that have been saved by users
  app.get("/articles/saved=true", function(req, res) {
    db.Article
      .find({saved: true})
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

  // Route for grabbing a specific Article by id, then populating it with it's note(s) to be displayed on the modal
  app.get("/articles/notes/:id", function(req, res) {
    db.Article
      .findOne({ _id: req.params.id })
      .populate("note.Note")
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

  // Route for saving a new note to an Article and associating the note to it
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note
      .create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. 
        // Update the Article to be associated with the new Note.
        // { upsert: true } checks to ensure the value is new before adding it.
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: {note: dbNote._id } }, { upsert: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

    // Route for collecting an Article's note body; for use in our appending notes to the Article Notes modal
  app.get("/notes/saved/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.find({ _id: req.params.id })
      .then(function(dbNote) {
        // If we were able to successfully find the requested note, notify the client
        res.json(dbNote);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

    // Route for deleting an Article's associated note in the note collection
  app.post("/notes/delete/:id", function(req, res) {
    // Find the note in the Note collection and remove it.
    db.Note.remove({ _id: req.params.id })
      .then(function(){
    db.Article.findOneAndUpdate(query, { $pull: { note: ObjectId(req.params.id) }})
      })
      .then(function(dbArticle) {
        // If we were able to successfully delete the note, notify the client
        res.json("Article note deleted.");
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
    });

  // Route for saving articles.
  app.post("/articles/saved/:id", function(req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
    .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

  // Route for unsaving articles.
  app.post("/articles/deleted/:id", function(req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false })
    .then(function(){
    db.Article.findOneAndUpdate({ _id: req.params.id }, {"$set": {"note": []}})
    .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
    });
  });
} // - End module exports