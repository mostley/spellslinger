var WebsocketServer = require('ws').Server;
var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/src');

var databaseUrl = "localhost";
var collections = ["channels"]
var db = require("mongojs").connect(databaseUrl, collections);

var connectedClients = {};
var channels = {};

var wsPort = 81;
var port = 8080;
var server = http.createServer(ecstatic);
server.listen(port);

var _clientId = 0;
var _channelsId = 0;
var wss = new WebsocketServer({ port: wsPort });


wss.broadcast = function(data, except) {
    for(var i in this.clients) {
        if (!except || this.clients[i] != except) {
            this.clients[i].send(data);
        }
    }
};

wss.broadcastChannel = function(channel, data, except) {
    var client_list = channels[channel_name].clients;
    if (client_list) {
        for(var i in client_list) {
            var client = client_list[i];
            if (!except || client != except) {
                client.send(data);
            }
        }
    }
};

wss.on('connection', function(socket) {
    var thisId = ++_clientId;

    connectedClients[thisId] = socket;

    console.log('Client #%d connected', thisId);
    
    wss.broadcast(JSON.stringify({ event_name: 'player_connected', data: thisId }), socket);

    socket.on('message', function(message) {
        console.log('Received data: %s from #%d', message, thisId);

        var obj = JSON.parse(message);

        if(obj.event_name.toLowerCase() == 'channel_list') {
            
            socket.send(JSON.stringify({ event_name: 'channel_list', data: channels }));

        } else if (obj.event_name.toLowerCase() == 'player_code') {

            var channelId = obj.data.channel;
            var code = obj.data.code;

            wss.wss.broadcastChannel(channelId, JSON.stringify({ event_name: 'player_code', data: { code: code, userId: thisId } }), socket);

        } else if (obj.event_name.toLowerCase() == 'set_channel') {
            var channelId = obj.data.id;
            var channelName = obj.data.name;
            var is_private = obj.data.is_private;

            if (!channelName && !channelId) {
                console.error("Client #"+thisId+": Tried to set null channel");
                socket.send(JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: 'channelName or channelId is required.' } }));
                return;
            }

            if (socket.channel) {
                var index = channels[socket.channel.id].clients.indexOf(thisId);
                channels[socket.channel.id].clients.splice(index, 1);
                socket.channel = null;
            }

            if (!channelId) {
                for (var id in channels) {
                    if (channels[id].name.toLowerCase() == channelName.toLowerCase()) {
                        channelId = id;
                        break;
                    }
                }

                if (!channelId) {
                    channelId = ++_channelsId;
                    console.log("Client #"+thisId+": Created new channel with id '" + channelId + "' and name "+ channelName +"'.");
                    channels[channelId] = {
                        id: channelId,
                        name: channelName,
                        is_private: is_private,
                        clients: []
                    };
                } else {
                    console.error("Client #"+thisId+": Channel '" + channelName + "' already exists.");
                    socket.send(JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Channel '" + channelName + "' already exists." } }));
                    return;
                }
            }

            if (!channels[channelId]) {
                console.error("Client #"+thisId+": Channel with id '" + channelId + "' does not exist.");
                socket.send(JSON.stringify({ event_name: 'error', data: { event_name: 'set_channel', reason: "Channel with id '" + channelId + "' does not exist." } }));
                return;
            }

            channels[channelId].clients.push(thisId);
            socket.channel = channels[channelId];

            socket.send(JSON.stringify({ event_name: 'set_channel', data: socket.channel }));
        }
    });
    
    socket.on('close', function() {
        console.log('Connection closed');
        delete connectedClients[thisId];

        wss.broadcast(JSON.stringify({ event_name: 'player_disconnected', data: thisId }), socket);

        if (socket.channel) {
            var index = channels[socket.channel.id].clients.indexOf(thisId);
            channels[socket.channel.id].clients.splice(index, 1);

            if (channels[socket.channel.id].clients.length <= 0) {
                delete channels[socket.channel.id];
            }
        }
    });

    socket.on('error', function(e) {
        console.log('Client #%d error: %s', thisId, e.message);
    });
});

console.log('Server started on port %s with websocket server running at %s', port, wsPort);