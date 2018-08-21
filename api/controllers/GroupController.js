/**
 * GroupController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  createGroup: async function(req, res) {

    var params = eval(req.body);
    var userid = params.userid;
    let members = params.members;
    // members=members.split(",");

    var reqData = eval(req.body);
    reqData['creator'] = userid;
    reqData['users'] = members;

    delete reqData.members;
    delete reqData.userid;


    // console.log("CreateUser groupname = " + groupname);

    var createdGroup = await Group.create(reqData).fetch();

    console.log('Created User :', createdGroup);
    return res.send({
      data: createdGroup,
      message: "Group created successfully",
    });
  },
  getGroup: function(req, res) {
    var groupid = req.param("groupid");
    if (!groupid)
      return res.badRequest({
        data: "",
        message: "Group with given id not exist!",
      });

    Group.find(groupid).populateAll().exec(function afterwards(err, group) {
      if (err) {
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }

      if (typeof group != "undefined" && group.length > 0) {
        res.send({
          data: group[0],
          message: "Group detail",
        });
      } else {
        sails.log("group undefined");
        var error = new Error({
          message: "Group not exist with given group id.",
        });
        error.status = 500;
        return res.serverError({
          message: "Something went wrong! Lets try again!",
          err,
        });
      }
    });
  },
  getGroups: function(req, res) {
    Group.find().exec(function afterwards(err, groups) {
      if (err) {
        return res.serverError({
          message: "Somehting went wrong! Lets try again!",
          err,
        });
      }

      res.send({
        data: groups,
        message: "Groups fetched successfully",
      });
    });
  },
  joinGroup: function (req, res) {

    var params = eval(req.body);
    sails.log("req params ", params);
    var userid = params.userid;
    var groupid = params.groupid;
    var members = params.members;
    sails.log("members",members);

    if (!groupid) {
      sails.log("Group id not set");
      return res.badRequest({
        data: "",
        message: "Group id not provided"
      });
    }

    var objGroup;
    var fromusername;
    var isgroupexist = false;
    var objeGroupMessage;

    async.series([
        function (cb) {
          Group.find({
              id: groupid
            })
            .populateAll()
            .exec(function afterwards(err, selgroup) {
              if (err) {
                return res.serverError({
                  message: "Somehting went wrong!",
                  err
                });
              }

              if (typeof selgroup != "undefined" && selgroup.length > 0) {
                Group.subscribe(req, groupid, ['message', 'destroy', 'update', 'add:users', 'remove:users']);
                selgroup[0].users.add(members);
                isgroupexist = true;
                selgroup[0].save(function (err) {
                  cb();
                });
              } else {
                var error = new Error({
                  message: sails.config.localised.groups.groupnotexist
                });
                error.status = 500;
                isgroupexist = false;
                cb(error);
              }
            });
        },
        function (fromusercb) {
          if (!isgroupexist) {
            var error = new Error({
              message: sails.config.localised.groups.groupnotexist
            });
            error.status = 500;
            fromusercb(error);
            return;
          }
          User.find(userid)
            .exec(function afterwards(err, users) {
              if (err) {
                fromusercb(err); //return res.serverError({ message: sails.config.localised.responses.somethingwentwrong, err });
              }
              if (typeof users != "undefined" && users.length > 0) {

                fromusername = users[0].fullName();

                if (!fromusername)
                  fromusername = users[0].mobilenumber;

                fromusercb();
              } else {
                var error = new Error({
                  message: sails.config.localised.user.usernotexist
                });
                error.status = 500;
                fromusercb(error);
              }
            });
        },
        function (groupdata) {
          if (!isgroupexist) {
            groupdata();
            return;
          }
          setTimeout(
            function () {
              Group.find({
                  id: groupid
                })
                .populateAll()
                .exec(function afterwards(err, objgroup) {
                  if (err) {
                    return groupdata();
                  }
                  objGroup = objgroup[0];
                  groupdata();
                });
            },
            1000
          );
        },
      ],
      function (err, finalresult) {
        if (err)
          res.serverError({
            message: sails.config.localised.responses.somethingwentwrong,
            err
          });
        else
          res.send({
            message: sails.config.localised.groups.groupjoinsuccess
          });
      });
  },

  leaveGroup: function (req, res) {

    var params = eval(req.body);
    var userid = params.userid;
    var groupid = req.param("groupid");
    var fromusername;
    var isgroupexist = false;

    if (!groupid) {
      sails.log("Group id not set");
      return res.badRequest({
        data: "",
        message: sails.config.localised.commonvalidation.groupidrequired
      });
    }

    var objGroup;
    var objeGroupMessage;

    async.series([
        function (cb) {
          UserGroup.find({
              id: groupid
            })
            .populateAll()
            .exec(function afterwards(err, selgroup) {
              if (err) {
                return res.serverError({
                  message: "Somehting went wrong!",
                  err
                });
              }
              if (typeof selgroup != "undefined" && selgroup.length > 0) {
                UserGroup.subscribe(req, groupid, ['message', 'destroy', 'update', 'add:users', 'remove:users']);
                selgroup[0].users.remove(userid);
                objGroup = selgroup[0];
                isgroupexist = true;
                selgroup[0].save(function (err) {
                  cb();
                });
              } else {
                var error = new Error({
                  message: sails.config.localised.groups.groupnotexist
                });
                error.status = 500;
                isgroupexist = false;
                cb(error);
              }
            });
        },
        function (fromusercb) {
          if (!isgroupexist) {
            fromusercb();
            return;
          }
          User.find(userid)
            .exec(function afterwards(err, users) {
              if (err) {
                fromusercb(err); //return res.serverError({ message: sails.config.localised.responses.somethingwentwrong, err });
              }
              if (typeof users != "undefined" && users.length > 0) {

                fromusername = users[0].fullName();

                if (!fromusername)
                  fromusername = users[0].mobilenumber;

                var reqchatData = {};
                reqchatData['fromuser'] = userid;
                reqchatData.groupid = groupid;
                reqchatData.messagestatus = 'sent';
                reqchatData.mediatype = 'text';
                reqchatData.ischatheader = true;
                reqchatData.chattype = 'groupchat';
                reqchatData.mediadata = 'You left ' + objGroup.groupname;
                reqchatData.chatheadertype = 'userleft';
                reqchatData.actionsby = userid;
                reqchatData.actionon = userid;
                reqchatData.touser = userid;

                Chat.create(
                  reqchatData
                ).exec(function (err, newchat) {
                  if (err) {
                    fromusercb(err); //return res.serverError({ message: sails.config.localised.responses.somethingwentwrong, err });
                  }
                  User.message(userid, {
                    actions: "headeruserleft",
                    actionsdata: newchat
                  });
                  fromusercb();
                });
              } else {
                fromusercb(err);
              }
            });
        },
        function (groupdata) {
          if (!isgroupexist) {
            groupdata();
            return;
          }
          setTimeout(
            function () {
              UserGroup.find({
                  id: groupid
                })
                .populateAll()
                .exec(function afterwards(err, objgroup) {
                  if (err) {
                    return groupdata();
                  }
                  objGroup = objgroup[0];
                  groupdata();
                });
            },
            1000
          );
        },
        function (creategroupmessagecb) {

          var reqgmData = {};
          reqgmData['fromuser'] = userid;
          reqgmData.groupid = groupid;

          GroupMessage.create(
            reqgmData
          ).exec(function (err, newgroupmessage) {
            if (err) {
              return res.serverError({
                message: sails.config.localised.responses.somethingwentwrong,
                err
              });
            }
            if (!newgroupmessage) {
              return res.serverError({
                message: sails.config.localised.responses.somethingwentwrong,
                err
              });
            }
            objeGroupMessage = newgroupmessage;
            creategroupmessagecb();
          });
        },
        function (sendmessagecb) {

          if (isgroupexist) {
            var users = objGroup.users;

            var reqchatData = {};
            reqchatData['fromuser'] = userid;
            reqchatData.groupid = groupid;
            reqchatData.messagestatus = 'sent';
            reqchatData.mediatype = 'text';
            reqchatData.ischatheader = true;
            reqchatData.chattype = 'groupchat';
            reqchatData.mediadata = fromusername+' left';
            reqchatData.chatheadertype = 'userleft';
            reqchatData.actionsby = userid;
            reqchatData.actionon = userid;

            async.eachSeries(users, function (user, cb) {
              reqchatData.touser = user.id;
              reqchatData.messagegroup = objeGroupMessage;
              var objchat;

              async.series([
                  function (createchatcb) {
                    Chat.create(
                      reqchatData
                    ).exec(function (err, newchat) {
                      if (err) {
                        createchatcb(err); //return res.serverError({ message: sails.config.localised.responses.somethingwentwrong, err });
                      }
                      objchat = newchat;
                      createchatcb();
                    });
                  },
                  function (tousercb) {

                    if (!user.socketid) {

                      if (userid != user.id) {
                        MuteGroup.find({
                          groupid: objGroup.id,
                          userid: user.id
                        }).exec(function (err, objMuteGroup) {
                          if (err)
                            return tousercb(err);

                          if (typeof objMuteGroup != "undefined" && objMuteGroup.length > 0) {
                            sails.log("group muted for this user");
                            tousercb();
                          } else {
                            sails.log("send message to user");

                            if (!user.devicetoken) {
                              sails.log("token not found");
                              return tousercb();
                            }

                            var mediadata = {};
                            mediadata['mediatitle'] = fromusername + ' left ' + objGroup.groupname;
                            mediadata['sender'] = fromusername;
                            mediadata['groupid'] = objGroup.id;
                            mediadata['actions'] = "headeruserleft";
                            mediadata['mediadata'] = fromusername+' left';
                            mediadata['chatid'] = objchat.id;
                            mediadata['mediatype'] = objchat.mediatype;
                            mediadata['notificationtype'] = objchat.chattype;
                            mediadata['groupname'] = objGroup.groupname;

                            pushService.createPushJob({
                              user: user,
                              mediadata: mediadata
                            }, function (err) {
                              if (err) {
                                sails.log("Sails error");
                                return tousercb(err);
                              }
                              tousercb();
                            });
                          }
                        });
                      } else {
                        tousercb();
                      }
                    } else {
                      User.message(user.id, {
                        actions: "headeruserleft",
                        actionsdata: objchat
                      });
                      tousercb();
                    }
                  },
                ],
                function (err, finalresult) {
                  if (err)
                    cb(err);
                  else
                    cb();
                }
              );
            }, function (err) {
              sendmessagecb();
            });
          } else {
            sendmessagecb();
          }
        }
      ],
      function (err, finalresult) {
        if (err)
          res.serverError({
            message: sails.config.localised.responses.somethingwentwrong,
            err
          });
        else
          res.send({
            message: sails.config.localised.groups.groupleavesuccess
          });
      });
  },
};

