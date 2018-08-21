/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  createUser: async function(req, res) {
    var params = eval(req.body);
    var username = req.param("username");

    console.log("CreateUser username = " + username);

    var createdUser = await User.create({username: username}).fetch();

    sails.log('Created User :', createdUser);
    return res.send({
      data: createdUser,
      message: "User created successfully",
    });
  },

  getUsers: function(req, res) {
    User.find().exec(function afterwards(err, users) {
      if (err) {
        return res.serverError({
          message: "Somehting went wrong! Lets try again!",
          err,
        });
      }

      res.send({
        data: users,
        message: "Users fetch successfully",
      });
    });
  },

  getUser: function(req, res) {
    var userid = req.param("userid");
    if (!userid)
      return res.badRequest({
        data: "",
        message: "User with given user id not exist!",
      });

    User.find(userid).exec(function afterwards(err, user) {
      if (err) {
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }

      if (typeof user != "undefined" && user.length > 0) {
        sails.log("user update");

        // if (userid) {
        //   User.message(userid, {
        //     actions: "userdetail",
        //     actionsdata: user[0],
        //   });
        // } else if (userid) {
        //   User.message(userid, {
        //     actions: "userdetail",
        //     actionsdata: user[0],
        //   });
        // }

        res.send({
          data: user[0],
          message: "User detail",
        });
      } else {
        sails.log("user undefined");
        var error = new Error({
          message: "User not exist with given user id.",
        });
        error.status = 500;
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }
    });
  },
  getOnlineUsers: function(req, res) {
    var userid = req.param("userid");

    if (!userid)
      return res.badRequest({
        data: "",
        message: "User with given user id not exist!",
      });

    User.find({
      userstatus: "online",
    }).exec(function afterwards(err, users) {
      if (err) {
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }

      if (req.isSocket) {
        User.subscribe(req, _.pluck(users, "id"), ["destroy", "update"]);
      }
      res.send({
        data: users,
        message: "Users fetched successfully.",
      });
    });
  },
};
