var db = require("../models");
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = function(app) {  
  // A GET route for scraping the echojs website
  app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.nytimes.com").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $("article.story").each(function(i, element) {
        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
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

        // Create a new Article using the `result` object built from scraping
        db.Article
          .create(result)
          .then(function(dbArticle) {
            // If we were able to successfully scrape and save an Article, send a message to the client
            res.send("Scrape Complete");
          }).catch(function(err) {
            // Remember the code below, it prevents unhandled promise rejections from stacking up with every scrape.
            if (err) {
            return res.send();
            }
            res.json("Scrape Complete with errors");
          });
        });
    });
  });

  // Route for getting all Articles from the db
  app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
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

  // Route for getting all Articles from the db that have not been saved
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

  // Route for getting all Articles from the db that have been saved by users
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

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/notes/:id", function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article
      .findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note.Note")
      .then(function(dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for saving an Article's associated note
  app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note
      .create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. 
        // Update the Article to be associated with the new Note.
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
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

    // Route for deleting an Article's associated note
  app.post("/notes/delete/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.remove({ _id: req.params.id })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, notify the client
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
    // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
    // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for unsaving articles.
  app.post("/articles/deleted/:id", function(req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false })
    .then(function(dbArticle) {
    // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
    // If an error occurred, send it to the client
        res.json(err);
      });
  });
} // - End module exports