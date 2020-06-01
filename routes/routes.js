module.exports = (app, passport, UserModel, stripe, PhotoModel, AWS, fs, signale, fileUpload) => {

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

  app.post('/upload', isLoggedIn, function (req, res) {
    //AWS S3 Setup
    const ID = 'AKIAIHCJPCJHTHVQKEPA';
    const SECRET = '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';
    const BUCKET_NAME = 'photoserve3';
    const s3 = new AWS.S3({
      accessKeyId: ID,
      secretAccessKey: SECRET
    });
    // Read content from the file
    const fileContent = Buffer.from(req.files.uploadedFileName.data, 'binary');

    // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: 'cat.jpg', // File name you want to save as in S3
      Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        throw err;
      }
      signale.success(`File uploaded successfully. ${data.Location}`);
    });
  });

  app.post('/upload-avatar', isLoggedIn, function (req, res) {
    //AWS S3 Setup
    const ID = 'AKIAIHCJPCJHTHVQKEPA';
    const SECRET = '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';
    const BUCKET_NAME = 'photoserve3';
    const s3 = new AWS.S3({
      accessKeyId: ID,
      secretAccessKey: SECRET
    });
    // Read content from the file
    //signale.watch(req.body.files)
    const fileContent = Buffer.from(req.file, 'binary');

    // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: `avatars/${req.user.username}/avatar.jpg`, // File name in S3
      Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        throw err;
      }
      signale.success(`File uploaded successfully. ${data.Location}`);
    });
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