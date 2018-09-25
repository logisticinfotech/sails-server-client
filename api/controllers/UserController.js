/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  createUser: async function(req, res) {
    var username = req.param("username");

    var createdUser = await User.create({ username: username, socketid: sails.sockets.getId(req) }).fetch();
    sails.log("Created User :", createdUser);
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
  getOnlineUsers: async function(req, res) {

    var userid = req.param("userid");
    console.log("get online users called");
    if (!userid)
      return res.badRequest({
        data: "",
        message: "User with given user id not exist!",
      });

      var allusers = await User.find({
        userstatus: "online",
      });

      if (typeof allusers != "undefined" && allusers.length > 0) {
        User.publish([userid], {
          actions: "onlineuserlist",
          actionsdata: allusers,
        });

        res.send({
          data: allusers,
          message: "Users fetched successfully.",
        });
      }
      else {
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }
  },
  updateUserStatus: function(req, res) {
    var userid = req.param("userid");
    sails.log("updateUserStatus");
    if (!userid)
      return res.badRequest({
        data: "",
        message: sails.config.localised.commonvalidation.useridrequired,
      });

    var reqData = eval(req.body);
    var socketId = sails.sockets.getId(req.socket);
    var updatedUser;

    reqData.socketid = socketId;
    var currentUser;
    delete reqData.userid;

    async.series(
      [
        async function(updateusercb) {
          var user = await User.update(
            {
              id: userid,
            },
            reqData
          ).fetch();
          console.log("user update", user);

          if (typeof user != "undefined" && user.length > 0) {
            currentUser = user[0];
            sails.log("User exist");
            if (req.isSocket) {
              updatedUser = user[0];
              if (updatedUser.userstatus == "offline")
                User.unsubscribe(req, _.pluck(user, "id"), ["message", "update"]);
              else User.subscribe(req, _.pluck(user, "id"), ["destroy", "update"]);

              updateusercb();
            } else {
              console.log("user update", user);
              updateusercb();
            }
          } else {
            sails.log("User not found");
            var error = new Error({
              message: "User not found",
            });
            error.status = 500;
            updateusercb(error);
          }
        },
        async function(subscribecb) {
          var allusers = await User.find({
            id: { "!=": userid },
          });

          sails.log(allusers);

          if (typeof allusers != "undefined" && allusers.length > 0) {
            if (req.isSocket) {
               User.subscribe(req, _.pluck(allusers, "id"), ["destroy", "update"]);

               User.publish(_.pluck(allusers, 'id'), {
                actions: "userstatusupdate",
                actionsdata: currentUser,
              });
            }
            subscribecb();
          } else {
            var error = new Error({
              message: "User not found",
            });
            error.status = 500;
            subscribecb(error);
          }
        },
      ],
      function(err) {
        if (err)
          res.serverError({
            message: "Something went wrong!",
            err,
          });
        else
          res.send({
            data: updatedUser,
            message: "User update success!",
          });
      }
    );
  },
};
