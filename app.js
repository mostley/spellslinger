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

var clientId = 0;
var wss = new WebsocketServer({ port: wsPort });


wss.broadcast = function(data, except) {
    for(var i in this.clients) {
        if (!except || this.clients[i] != except) {
            this.clients[i].send(data);
        }
    }
};

wss.broadcastChannel = function(channel, data, except) {
    var client_list = channels[channel_name];
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
    var thisId = ++clientId;

    connectedClients[thisId] = socket;

    console.log('Client #%d connected', thisId);
    
    wss.broadcast(JSON.stringify({ event_name: 'player_connected', data: thisId }), socket);

    socket.on('message', function(message) {
        console.log('Received data: %s from #%d', message, thisId);

        var obj = JSON.parse(message);

        if(obj.event_name.toLowerCase() == 'channel_list') {
            
            socket.send(JSON.stringify({ event_name: 'channel_list', data: channels }));
        } else if (obj.event_name.toLowerCase() == 'player_code') {

            var channel = obj.data.channel;
            var code = obj.data.code;

            wss.wss.broadcastChannel(channel, JSON.stringify({ event_name: 'player_code', data: { code: code, userId: thisId } }), socket);

        } else if (obj.event_name.toLowerCase() == 'set_channel') {
            var channel = obj.data;

            if (socket.channel) {
                var index = channels[socket.channel].indexOf(thisId);
                channels[socket.channel].splice(index, 1);
            }

            if (!channels[channel]) {
                channels[channel] = [];
            }

            channels[channel].push(thisId);
            socket.channel = channel;
        }
    });
    
    socket.on('close', function() {
        console.log('Connection closed');
        delete connectedClients[thisId];

        wss.broadcast(JSON.stringify({ event_name: 'player_disconnected', data: thisId }), socket);
    });

    socket.on('error', function(e) {
        console.log('Client #%d error: %s', thisId, e.message);
    });
});

console.log('Server started on port %s with websocket server running at %s', port, wsPort);