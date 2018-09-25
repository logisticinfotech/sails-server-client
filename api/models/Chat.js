/**
 * Chat.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    fromuser: {
      type: "integer",
    },
    touser: {
      type: "integer",
    },
    chattype: {
      type: "string",
      enum: ["normalchat", "privatechat", "groupchat"],
      defaultsTo: "normalchat",
    },
    messagestatus: {
      type: "string",
      enum: ["sent", "delivered", "viewed"],
      defaultsTo: "sent",
    },
    mediatype: {
      type: "string",
      enum: ["text", "image", "audio", "video", "contact", "location"],
      defaultsTo: "",
    },
    mediadata: {
      type: "longtext",
      defaultsTo: "",
    },
    mediasize: {
      type: "integer",
      defaultsTo: 0,
    },
    imgheight: {
      type: "integer",
      defaultsTo: 0,
    },
    imgwidth: {
      type: "integer",
      defaultsTo: 0,
    },
  },
};
