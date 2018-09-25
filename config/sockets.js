/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * Use the settings below to configure realtime functionality in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/sockets
 */

module.exports.sockets = {
  /***************************************************************************
   *                                                                          *
   * `transports`                                                             *
   *                                                                          *
   * The protocols or "transports" that socket clients are permitted to       *
   * use when connecting and communicating with this Sails application.       *
   *                                                                          *
   * > Never change this here without also configuring `io.sails.transports`  *
   * > in your client-side code.  If the client and the server are not using  *
   * > the same array of transports, sockets will not work properly.          *
   * >                                                                        *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/reference/web-sockets/socket-client           *
   *                                                                          *
   ***************************************************************************/

  // transports: [ 'websocket' ],

  /***************************************************************************
   *                                                                          *
   * `beforeConnect`                                                          *
   *                                                                          *
   * This custom beforeConnect function will be run each time BEFORE a new    *
   * socket is allowed to connect, when the initial socket.io handshake is    *
   * performed with the server.                                               *
   *                                                                          *
   * https://sailsjs.com/config/sockets#?beforeconnect                        *
   *                                                                          *
   ***************************************************************************/

  beforeConnect: function(handshake, proceed) {
    // `true` allows the socket to connect.
    // (`false` would reject the connection)

    console.log("Socket gets connected");
    return proceed(undefined, true);
  },

  /***************************************************************************
   *                                                                          *
   * `afterDisconnect`                                                        *
   *                                                                          *
   * This custom afterDisconnect function will be run each time a socket      *
   * disconnects                                                              *
   *                                                                          *
   ***************************************************************************/

  afterDisconnect: function(session, socket, done) {
    // By default: do nothing.
    sails.log("socket disconnected for socket id ", socket.id);
    reqData = {};
    reqData.userstatus = "offline";
    reqData.socketid = "";
    var currentUser;
    async.series(
      [
        async function(userCb) {
          var user = await User.update({ socketid: socket.id }, reqData).fetch();
          console.log("user update", user);

          if (typeof user != "undefined" && user.length > 0) {
            currentUser = user[0];
            User.unsubscribe(socket, _.pluck(user, "id"));
          }
          userCb();
        },
        async function(publishevent) {
          if (!currentUser) return publishevent();

          var allusers = await User.find({
            id: { "!=": currentUser.id },
          });

          console.log("user update", allusers);

          if (typeof allusers != "undefined" && allusers.length > 0) {
            User.publish(_.pluck(allusers, "id"), {
              actions: "userstatusupdate",
              actionsdata: currentUser,
            });
          }

          publishevent();
        },
      ],
      function(err, result) {
        return done();
      }
    );

    return done();
  },

  /***************************************************************************
   *                                                                          *
   * Whether to expose a 'GET /__getcookie' route that sets an HTTP-only      *
   * session cookie.                                                          *
   *                                                                          *
   ***************************************************************************/

  // grant3rdPartyCookie: true,
};
