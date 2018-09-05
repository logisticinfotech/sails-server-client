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
    var sentmessagecount = 0;
    var isSocketFind = false;

    reqData.socketid = socketId;

    delete reqData.userid;
    var userStatus;
    var chatAll;

    async.series(
      [
        function(updateusercb) {
          User.update(
            {
              id: userid,
            },
            reqData
          ).exec(function afterwards(err, user) {
            if (err) {
              return updateusercb(err);
            }

            if (typeof user != "undefined" && user.length > 0) {
              sails.log("User exist");
              if (req.isSocket) {
                updatedUser = user[0];
                User.subscribe(req, _.pluck(user, "id"), ["message", "update"]);

                setTimeout(function() {
                  User.publishUpdate(userid, {
                    actions: "userstatusupdate",
                    actionsdata: updatedUser,
                  });
                  updateusercb();
                }, 1000);
              } else {
                console.log("user update", user);
                  updateusercb();
              }
            } else {
              sails.log("User not found");
              var error = new Error({
                message: sails.config.localised.user.usernotexist,
              });
              error.status = 500;
              updateusercb(error);
            }
          });
        },
        function(subscribecb) {
          var query =
            "SELECT * FROM user WHERE FIND_IN_SET(id, (SELECT GROUP_CONCAT(userid) FROM `contact` WHERE contactuserid = " +
            userid +
            " AND userid IS NOT NULL))";
          User.query(query, [], function(err, users) {
            if (err) {
              subscribecb(err);
            }
            // sails.log("user list", users);
            if (typeof users != "undefined" && users.length > 0) {
              if (req.isSocket) {
                User.subscribe(req, _.pluck(users, "id"), ["destroy", "update"]);
              }
            }
            subscribecb();
          });
        },
        function(subscribegroupcb) {
          var query =
            "SELECT * FROM usergroup WHERE FIND_IN_SET(id, (SELECT GROUP_CONCAT(`usergroup_users`) FROM `user_groups__usergroup_users` WHERE `user_groups` = " +
            userid +
            " ))";
          UserGroup.query(query, [], function(err, groups) {
            if (err) {
              subscribegroupcb(err);
            }
            if (typeof groups != "undefined" && groups.length > 0) {
              if (req.isSocket) {
                UserGroup.subscribe(req, _.pluck(groups, "id"), [
                  "message",
                  "destroy",
                  "update",
                  "add:users",
                  "remove:users",
                ]);
              }
            }
            subscribegroupcb();
          });
        },
      ],
      function(err, finalresult) {
        if (err)
          res.serverError({
            message: sails.config.localised.responses.somethingwentwrong,
            err,
          });
        else
          res.send({
            data: updatedUser,
            message: sails.config.localised.user.userupdatesucess,
          });
      }
    );
  },
};
