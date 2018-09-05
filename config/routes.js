/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝

  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  "/": {
    view: "pages/homepage",
  },

  /****** User Routes ******/
  "post /user": {
    controller: "UserController",
    action: "createUser",
  },
  "get /user/:userid": {
    controller: "UserController",
    action: "getUser",
  },
  "get /userlist": {
    controller: "UserController",
    action: "getUsers",
  },
  "get /onlineuser/:userid": {
    controller: "UserController",
    action: "getOnlineUsers",
  },
  "post /updateuserstatus": {
    controller: "UserController",
    action: "updateUserStatus",
  },

  /****** Group Routes ******/
  "post /group": {
    controller: "GroupController",
    action: "createGroup",
  },
  "get /group/:groupid": {
    controller: "GroupController",
    action: "getGroup",
  },
  "get /grouplist": {
    controller: "GroupController",
    action: "getGroups",
  },
  "put /group": {
    controller: "GroupController",
    action: "joinGroup",
  },
  "put /group/leave": {
    controller: "GroupController",
    action: "leaveGroup",
  },

  /****** Chat Routes ******/
  "post /chat/privatemessage": {
    controller: "ChatController",
    action: "privateMessage",
  },
  "post /chat/privatemessagestatus": {
    controller: "ChatController",
    action: "privateMessageStatus",
  },
  "post /chat/multiplemessagestatus": {
    controller: "ChatController",
    action: "multipleMessageStatus",
  },
  "post /chat/multiplemessagestatusupdate": {
    controller: "ChatController",
    action: "multipleMessageStatusforUser",
  },
  "post /chat/usertyping": {
    controller: "ChatController",
    action: "userTyping",
  },
  "post /chat/detail": {
    controller: "ChatController",
    action: "chatDetail",
  },
  "post /chat/history": {
    controller: "ChatController",
    action: "chatHistory",
  },
  "post /chat/groupmessage": {
    controller: "ChatController",
    action: "groupMessage",
  },
  "post /chat/grouptyping": {
    controller: "ChatController",
    action: "groupMessageTyping",
  },
  "post /chat/groupmessagedetail": {
    controller: "ChatController",
    action: "getGroupMessage",
  },
  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/

  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝

  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝
};
