var WebsocketServer = require('ws').Server;
var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/src');

var databaseUrl = "mongodb://heroku:NjY8S3mT@ds053958.mongolab.com:53958/heroku_app19490862";
var collections = ["channels"]

console.log("Connecting to database...");
var db = require("mongojs").connect(databaseUrl, collections);

var connectedClients = {};
//var channels = {};

var port = process.env.PORT || 8080;
var _clientId = 0;
var _channelsId = 0;

var channeldb = {

    add_channel: function (channel) {

        db.channels.save(channel);
    },

    remove_channel: function (channelId) {

        db.channels.remove({ id: parseInt(channelId) });
    },

    update_channel: function (channel) {

        db.channels.update(channel);
    },

    get_channel_by_id: function (channelId, callback, error) {
        db.channels.find({ id: parseInt(channelId) }, function(err, docs) {
            if (err) {
                if (error) { error(err); }
            } else if (!docs || docs.length <= 0) {
                if (error) { error("Channel with id '" + channelId + "'' not found."); }
            } else {
                if (docs.length > 1) { console.warn("Multiple Channels with id '" + channelId + "'' found.")}
                if (callback) { callback(docs[0]); }
            }
        });
    },

    get_channel_by_name: function (channelName, callback, error) {
        db.channels.findOne({ name: channelName }, function(err, doc) { 
            if (err) {
                if (error) { error(err); }
            } else if (!doc) {
                if (error) { error("Channel with name '" + channelName + "'' not found."); }
            } else {
                if (callback) { callback(doc); }
            }
        });
    },

    get_channel_list: function (callback, error) {
        db.channels.find(function(err, channels) {
            if (err) {
                if (error) { error(err); }
            } else if (!channels) {
                if (callback) { callback([]); }
            } else {
                if (callback) { callback(channels); }
            }
        });
    },

    remove_client_from_channel: function (channelId, clientId) {
        db.channels.update( { id: parseInt(channelId) }, { $pull: { clients: clientId } } );

        db.channels.remove({ clients: { $size: 0 } }, function(err, n, res) {
            console.log("Closed " + n + " Channel[s] without clients.");
        });
    },

    add_client_to_channel: function (channelId, clientId, callback, error) {
        var me = this;

        db.channels.update({ id: parseInt(channelId) }, { $addToSet: { clients: clientId }}, function(err, n, res) {
            if (err) {
                if (error) { error(err); }
            } else {
                if (callback) {
                    me.get_channel_by_id(channelId, function(channel) {

                        callback(channel);
                    });
                }
            }
        });
    },

    initial_cleanup: function() {
        db.channels.update( 
            { clients: { $not: { $size: 0 } } }, 
            { $set: { clients: [] }  }, 
            { multi: true }, 
            function(err, n, res) {
                console.log("Cleared " + n + " Channels.");
            });
    }
};

console.log("Cleaning up the DB");
channeldb.initial_cleanup();

console.log("Starting Webserver...");
var server = http.createServer(ecstatic);
server.listen(port);

console.log("Starting WebSocketServer...");
var wss = new WebsocketServer({
    server: server,
    autoAcceptConnections: false
});

wss.broadcast = function(data, except) {
    for(var i in this.clients) {
        if (!except || this.clients[i] != except) {
            this.clients[i].send(data);
        }
    }
};

wss.broadcastChannel = function(channel_name, data, except) {
    var client_list = channels[channel_name].clients;
    if (client_list) {
        for(var i in client_list) {
            var clientId = client_list[i];
            if (!except || clientId != except) {
                connectedClients[clientId].send(data);
            }
        }
    }
};

function send(socket, msg) {
    console.log("Sending to client #" + socket._id + " msg: " + msg);
    socket.send(msg);
}

wss.on('connection', function(socket) {
    var thisId = ++_clientId;

    connectedClients[thisId] = socket;
    socket._id = thisId;

    console.log('Client #%d connected', thisId);
    
    wss.broadcast(JSON.stringify({ event_name: 'player_connected', data: thisId }), socket);

    socket.on('message', function(message) {
        try {
            console.log('Received data: %s from #%d', message, thisId);

            var obj = JSON.parse(message);

            if(obj.event_name.toLowerCase() == 'channel_list') {
                
                channeldb.get_channel_list(function(channels) {
                    
                    try {
                        send(socket, JSON.stringify({ event_name: 'channel_list', data: channels }));
                    } catch (e) {
                        console.error("Client #"+thisId+": produced exception: "+e+".");
                    }
                }, function (err) {
                    try {
                        console.error("Client #"+thisId+": failed to receive list of channels. reason: %s", err);
                        send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'channel_list', reason: err } }));
                    } catch (e) {
                        console.error("Client #"+thisId+": produced exception: "+e+".");
                    }
                });

            } else if (obj.event_name.toLowerCase() == 'player_code') {

                var channelId = obj.channel;
                var code = obj.data.code;

                wss.broadcastChannel(channelId, JSON.stringify({ event_name: 'player_code', data: { username: obj.data.username, code: code, userId: thisId } }), thisId);

            } else if (obj.event_name.toLowerCase() == 'set_channel') {
                var channelId = obj.data.id;
                var channelName = obj.data.name;
                var is_private = obj.data.is_private;

                if (!channelName && !channelId) {
                    console.error("Client #"+thisId+": Tried to set null channel");
                    send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: 'channelName or channelId is required.' } }));
                    return;
                }

                if (socket.channelId) {
                    channeldb.remove_client_from_channel(socket.channelId, thisId);
                    socket.channelId = null;
                }

                var createNewChannel = !channelId;

                if (createNewChannel) {
                    channeldb.get_channel_by_name(channelName, function (channel) {

                        try {
                            console.error("Client #"+thisId+": Channel '" + channelName + "' already exists.");
                            send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Channel '" + channelName + "' already exists." } }));
                        } catch (e) {
                            console.error("Client #"+thisId+": produced exception: "+e+".");
                        }
                    }, function (err) {

                        try {
                            channelId = ++_channelsId;
                            console.log("Client #"+thisId+": Created new channel with id '" + channelId + "' and name '"+ channelName +"'.");
                            var channel = {
                                id: channelId,
                                name: channelName,
                                is_private: is_private,
                                clients: [ thisId ]
                            };
                            channeldb.add_channel(channel);
                            socket.channelId = channelId;
                            
                            send(socket, JSON.stringify({ event_name: 'set_channel', data: channel }));
                        } catch (e) {
                            console.error("Client #"+thisId+": produced exception: "+e+".");
                        }
                    });
                } else {

                    channeldb.get_channel_by_id(channelId, function(channel) {

                        try {

                            channeldb.add_client_to_channel(channelId, thisId, function(joinedChannel) {

                                console.log("Client #"+thisId+" joined channel with id '" + channelId + "'.");
                                socket.channelId = channelId;
                                send(socket, JSON.stringify({ event_name: 'set_channel', data: joinedChannel }));
                            }, function(err) {

                                console.error("Client #"+thisId+": Failed to join Channel with id '" + channelId + "'. reason: " + e);
                                send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Failed to join Channel with id '" + channelId + "'. reason: " + e } }));
                            });

                        } catch (e) {
                            console.error("Client #"+thisId+": produced exception: "+e+".");
                        }

                    }, function(err) {

                        try {
                            console.error("Client #"+thisId+": Channel with id '" + channelId + "' does not exist.");
                            send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Channel with id '" + channelId + "' does not exist." } }));
                        } catch (e) {
                            console.error("Client #"+thisId+": produced exception: "+e+".");
                        }
                    });
                }
            } else if (obj.event_name.toLowerCase() == 'get_status') {
                var channelId = obj.data.id;

                channeldb.get_channel_by_id(channelId, function(channel) {

                    if (channel.clients.length > 0) {

                        connectedClients[thisId].send(JSON.stringify({ event_name: 'get_status', data: { requestingClientId: thisId } }));

                    } else {
                        console.log("Channel #'"+ channelId +"' has no players left and will be closed.");
                        channeldb.remove_channel(channelId);

                        send(socket, JSON.stringify({ event_name: 'send_status', data: { status: null } }));
                    }

                }, function (err) {
                    console.error("Client #"+thisId+": channel with id: '" + channelId + "' not found.");
                    send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Channel with id: '" + channelId + "' not found." } }));
                });

            } else if (obj.event_name.toLowerCase() == 'send_status') {
                var clientId = obj.data.clientId;

                if (clientId) {
                    connectedClients[clientId].send(channelId, JSON.stringify({ event_name: 'send_status', data: { status: obj.data.status } }), thisId);
                } else {
                    wss.broadcast(channelId, JSON.stringify({ event_name: 'send_status', data: { status: obj.data.status } }), thisId);
                }
            } else {
                console.error("Client #"+thisId+": unkown event: '" + obj.event_name + "'.");
                send(socket, JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Unkown event: '" + obj.event_name + "'." } }));
            }
        } catch (e) {
            console.error("Client #"+thisId+": produced exception: "+e+".");
        }
    });
    
    socket.on('close', function() {
        console.log('Connection closed');
        delete connectedClients[thisId];

        wss.broadcast(JSON.stringify({ event_name: 'player_disconnected', data: thisId }), socket);

        if (socket.channelId) {
            channeldb.remove_client_from_channel(socket.channelId, thisId);
        }
    });

    socket.on('error', function(e) {
        console.log('Client #%d error: %s', thisId, e.message);
    });
});

console.log('Server started on port %s', port);