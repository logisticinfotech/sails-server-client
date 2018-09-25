/**
 * ChatController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var moment = require("moment");
var sizeOf = require("image-size");
var _$ = require("underscore");

module.exports = {
  privateMessage: function(req, res) {
    var fromuserid = req.param("userid");
    var touserid = req.param("touserid");
    var localchatid = req.param("localchatid");
    var message = req.param("msg");
    var reqData = {};
    reqData["fromuser"] = fromuserid;
    reqData.touser = touserid;
    reqData.chattype = "normalchat";
    reqData.messagestatus = "sent";
    reqData.mediatype = "text";

    sails.log("User ", fromuserid, "Write to ", touserid + " send msg: ", message);

    if (localchatid) reqData.localchatid = localchatid;

    reqData.mediadata = message;

    if (!fromuserid) {
      sails.log("From User id required");
      return res.badRequest({
        data: "",
        message: sails.config.localised.commonvalidation.useridrequired,
      });
    }

    if (!touserid) {
      sails.log("To User id required");
      return res.badRequest({
        data: "",
        message: sails.config.localised.commonvalidation.useridrequired,
      });
    }

    var objchat;
    var fromusername;
    var isblockeduser = false;
    var isspamuser = false;
    var ismuteduser = false;
    var fromuserobject;
    async.series(
      [
        function(createchatcb) {
          Chat.create(reqData)
            .fetch()
            .exec(function(err, newchat) {
              if (err) {
                createchatcb(err);
              }
              objchat = newchat;
              User.publish(
                [fromuserid, touserid],
                {
                  verb: "published",
                  actions: "message",
                  messagedata: message,
                  chat: objchat,
                },
                req
              );
              createchatcb();
            });
        },
      ],
      function(err) {
        if (err)
          res.serverError({
            message: "Something went wrong",
            err,
          });
        else {
          res.send({
            data: {
              actions: "message",
              actionsdata: objchat,
            },
            message: "Chat message sent successfully",
          });
        }
      }
    );
  },

  userTyping: function(req, res) {
    var userid = req.param("userid");
    var touserid = req.param("touserid");

    sails.log("User ", userid, "typing... to " + touserid);

    User.publish(
      [userid, touserid],
      {
        verb: "published",
        actions: "typing",
        fromuser: userid,
      },
      req
    );

    res.send({
      data: {
        actions: "typing",
        actionsdata: {
          fromuser: userid,
          touser: touserid,
          msg: "",
        },
      },
      message: "Typing events sent successfully",
    });
  },

  chatDetail: function(req, res) {
    var chatid = req.param("chatid");
    var userid = req.param("userid");

    Chat.find({
      id: chatid,
    }).exec(function(err, objChat) {
      if (err) return checkforblockcb(err);

      if (typeof objChat != "undefined" && objChat.length > 0) {
        sails.log("blocked user");

        if (req.isSocket) {
          User.publish([userid], {
            actions: "chatDetail",
            actionsdata: objChat[0],
          });
        }
        res.send({
          data: {
            actions: "chatDetail",
            actionsdata: objChat[0],
          },
          message: "Chat detail",
        });
      } else {
        res.send({
          data: {
            actions: "chatDetail",
            actionsdata: {},
          },
          message: "Chat object not exit",
        });
      }
    });
  },
  privateMessageStatus: function(req, res) {
    var chatid = req.param("chatid");
    var messagestatus = req.param("messagestatus");

    if (!chatid)
      return res.badRequest({
        data: "",
        message: sails.config.localised.chat.chatnotexist,
      });

    var reqData = {};
    reqData.messagestatus = messagestatus;

    Chat.update(
      {
        id: chatid,
      },
      reqData
    ).exec(function afterwards(err, chatData) {
      if (err) {
        sails.log("Updated Chat err  ", err);
        res.serverError({
          message: sails.config.localised.responses.somethingwentwrong,
          err,
        });
      }
      if (typeof chatData != "undefined" && chatData.length > 0) {
        if (!chatData[0].groupid) {
          User.publish([chatData[0].touser, chatData[0].fromuser], {
            actions: "messagestatus",
            actionsdata: chatData[0],
          });
        } else {
          User.publish([chatData[0].touser], {
            actions: "messagestatus",
            actionsdata: chatData[0],
          });
        }
      }
      res.send({
        message: "Message status upfated",
      });
    });
  },

  multipleMessageStatusforUser: function(req, res) {
    var params = eval(req.body);
    var userid = params.userid;
    var touserid = params.touserid;
    var groupid = params.groupid;

    var querydata = {};

    if (!groupid) {
      querydata = {
        or: [
          {
            touser: userid,
            fromuser: touserid,
            messagestatus: "delivered",
            chattype: "normalchat",
          },
          {
            touser: userid,
            fromuser: touserid,
            messagestatus: "sent",
            chattype: "normalchat",
          },
        ],
      };
    } else {
      querydata = {
        or: [
          {
            touser: userid,
            groupid: groupid,
            messagestatus: "delivered",
            chattype: "groupchat",
          },
          {
            touser: userid,
            groupid: groupid,
            messagestatus: "sent",
            chattype: "groupchat",
          },
        ],
      };
    }
    var status = {
      messagestatus: "viewed",
    };

    Chat.update(querydata, status).exec(function afterwards(err, updatedchats) {
      if (err) {
        console.log("error in update\n" + err);
        return res.serverError({
          message: sails.config.localised.responses.servererror,
        });
      } else {
        var chatids = "";
        if (typeof updatedchats != "undefined" && updatedchats.length > 0) {
          updatedchats.forEach(function(chatobject) {
            if (chatobject.id) {
              chatids += "," + chatobject.id;
            }
          });
          if (chatids.charAt(0) === ",") chatids = chatids.substr(1);
          chatids = chatids.split(",");
          chatids = _$.uniq(chatids, false);
          chatids = _$.reject(chatids, function(item) {
            return item == "null";
          });
          chatids = chatids.join(",");
        }
        console.log("Users ids ", chatids);
        if (chatids) {
          User.message(userid, {
            actions: "bulkmessagestatus",
            actionsdata: chatids,
          });
        }
        res.send({
          chatids: chatids,
          message: sails.config.localised.chat.chatstatusupdate,
        });
      }
    });
  },

  multipleMessageStatus: function(req, res) {
    var params = eval(req.body);
    var chatids = params.chatids.split(",");
    var messagestatus = params.messagestatus;
    var reqData = {};
    reqData.messagestatus = messagestatus;
    sails.log("ReqData ", chatids);
    async.eachSeries(
      chatids,
      function(chatid, cb) {
        Chat.update(
          {
            id: chatid,
          },
          reqData
        ).exec(function afterwards(err, chatData) {
          if (err) {
            cb(err);
            return;
          }
          if (typeof chatData != "undefined" && chatData.length > 0) {
            if (!chatData[0].groupid) {
              User.publish([chatData[0].touser, chatData[0].fromuser], {
                actions: "messagestatus",
                actionsdata: chatData[0],
              });
            } else {
              User.publish([chatData[0].touser], {
                actions: "messagestatus",
                actionsdata: chatData[0],
              });
            }
            cb();
          } else {
            cb();
            return;
          }
        });
      },
      function() {
        res.send({
          message: "Status updated for all messages",
        });
      }
    );
  },

  chatHistory: async function(req, res) {
    var userid = req.param("userid");
    var createdAt = req.param("createdAt");

    if (!userid)
      return res.badRequest({
        data: "",
        message: "User id required",
      });

    sails.log("CreatedAt date: ", createdAt);
    var dateObj = moment(createdAt);
    var createdAtFormated = dateObj.utc().format("YYYY-MM-DD HH:mm:ss");
    sails.log("Date other way: ", dateObj);

    var allChats = await Chat.find({
      touser: userid,
    });

    res.send({
      data: allChats,
      objectcounts: allChats.length,
      message: "All chat fetched",
    });
  },
};
