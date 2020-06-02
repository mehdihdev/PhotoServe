module.exports = (app, passport, UserModel, stripe, PhotoModel, AWS, fs, signale, s3, path, keys, fileUpload, client) => {
  require('dotenv').config();
  var resultHandler = function(err) { 
    if(err) {
       console.log("unlink failed", err);
    } else {
       console.log("file deleted");
    }
  }

  // Post route to handle uploading of a file
  app.post('/upload', isLoggedIn, function(req, res) {
    
    // Sending error back when no files were uploaded
    if (!req.files) {
      return res.send('No files were uploaded.');
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file (this must match the HTML name attribute on the input element)
    var sampleFile = req.files.sampleFile;
    
    var newFileName = Date.now() + req.files.sampleFile.name; // creating unique file name based on current time and file name of file uploaded, that way if two people upload the same file name it won't overwrite the existing file
    
    // Use the mv() method to place the file somewhere on your server (in this case we are placing it to the `uploads` folder with the name that we just created above, newFileName)
    sampleFile.mv('uploads/' + newFileName, function(err) {
      // If there was an error send that back as the response
      if (err) {
        return res.send(err);
      }
  
      // Upload to S3
      var params = {
        // The file on our server that we want to upload to S3
        localFile: 'uploads/' + newFileName,
        
        
        s3Params: {
          Bucket: process.env.AWSBUCKET,
          Key: "avatars/" + req.user.username + "/" + newFileName, // File path of location on S3
          ACL:'public-read'
        },
      };
      var uploader = client.uploadFile(params);

      // On S3 error
      uploader.on('error', function(err) {
        // On error print the error to the console and send the error back as the response
        console.error("unable to upload:", err.stack);
        res.send(err.stack);
      });
      // On S3 success
      uploader.on('end', function() {
        UserModel.updateOne({ username: req.user.username }, { avatar: "https://photoserve3.s3.amazonaws.com/avatars/" + req.user.username + "/" + newFileName }, function(
          err,
          result
        ) {
          if (err) {
            //res.send(err);
          } else {
            res.redirect('/profile');
                    // Print done uploading on success
            signale.success("done uploading");
            // Send back a success message as the response
            //res.send('File uploaded!');
            //Removing file from server after uploaded to S3
            fs.unlink('uploads/' + newFileName, resultHandler);
              }
            });
      });
    });
  });

  // Home Page
  app.get("/", (req, res) => res.render("home", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.get("/photos", (req, res) => res.render("photos", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.get("/upload", isLoggedIn, (req, res) => {
    let redirectUrl = `/user/${req.user.username}/upload`;
    res.redirect(redirectUrl);
  });

  app.get("/user/:username/upload", isLoggedIn, (req, res) => res.render("upload", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.get("/edit-profile", isLoggedIn, (req, res) => {
    let redirectUrl = `/user/${req.user.username}/edit-profile`;
    res.redirect(redirectUrl);
  });

  app.get("/user/:username/edit-profile", isLoggedIn, (req, res) => res.render("edit-profile", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));


  app.get("/photos/:photoID", (req, res) => res.render("photo-detail", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));



  app.post('/upload-avatar', isLoggedIn, (req, res) => {

  });

  app.post("/charge", isLoggedIn, (req, res) => {
    try {
      stripe.customers
        .create({
          name: req.user.name,
          email: req.user.email,
          source: req.body.stripeToken
        })
        .then(customer =>
          stripe.charges.create({
            amount: req.body.amount * 100,
            currency: "usd",
            customer: customer.id
          })
        )
        .then(() => res.render("completed"))
        .catch(err => signale.fatal(err));
    } catch (err) {
      res.send(err);
    }
  });


  // Login
  app.get("/login", (req, res) => res.render("login", {
    message: req.flash("loginMessage"),
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.get("/checkout", isLoggedIn, (req, res) => res.render("checkout", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/profile", // redirect to the secure profile section
    failureRedirect: "/login", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // Signup
  app.get("/signup", (req, res) => res.render("signup", {
    isAuth: req.isAuthenticated(),
    user: req.user
  }));

  app.post("/signup", passport.authenticate("local-signup", {
    successRedirect: "/profile",
    failureRedirect: "/signup"
  }));

  // Profile
  app.get("/profile", isLoggedIn, (req, res) => {
    let redirectUrl = `/user/${req.user.username}`;
    res.redirect(redirectUrl);
  });

  app.get("/user/:username", (req, res) => {
    let username = req.params.username;
    UserModel.findOne({
      username
    }, (err, doc) => {
      if (err) throw err;
      if (!doc)
        res.render("404", {
          isAuth: req.isAuthenticated(),
          user: req.user,
          profile: null,
        });
      else {
        res.render("profile", {
          isAuth: req.isAuthenticated(),
          user: req.user,
          profile: doc,
          isRoot: req.isAuthenticated() ? doc.username === req.user.username : false
        });
      }
    });

  });
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.get("/check-username-availability", (req, res) => {
    UserModel.find((err, users) => {
      if (err) throw err;
      let usernames = users.map(val => val.username);
      res.json(usernames);
    });
  });

  // About Page
  app.get("/about", (req, res) => {
    res.render("about", {
      isAuth: req.isAuthenticated(),
      user: req.user,
    });
  });

  app.get("*", (req, res) => {
    res.render("404", {
      isAuth: req.isAuthenticated(),
      user: req.user,
    });
  });
};

function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on 
  if (req.isAuthenticated())
    return next();
  // if they aren't redirect them to the home page
  res.redirect("/login");
}