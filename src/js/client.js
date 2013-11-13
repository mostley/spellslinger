if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Communication.Client = {
	events: {
		player_connected: 'player_connected', 
		player_ready: 'player_ready', 
		player_disconnected: 'player_disconnected', 
		client_connected: 'client_connected',
		client_disconnected: 'client_disconnected',
		channel_list: 'channel_list'
	},

	eventHandler: {},

	host: "ws://localhost:8000/",

	_socket: null,
	_channel: null,

	connect: function() {
		var me = this;

		var result = false;

		console.log("connecting to '" + me.host + "' ...");

    	try {
			me._socket = new WebSocket(me.host);

			socket.onopen = function() {
			    me.trigger(me.events.player_connected, me);
			};

			socket.onmessage = me._message_received.bind(me);
	  
	        socket.onclose = function() {
			    me.trigger(me.events.client_disconnected, me);
	        };

			console.log("... connected.");
	        me.trigger(me.events.client_connected, me);

	    	result = true;
	    } catch(e) {
	    	console.error(e);
	    }

	    return result;
	},

	disconnect: function() {
		if (me._socket) {
			me._socket.close();
			me._socket = null;
		}
	},

	setChannel: function(channel) {
		me._channel = channel;
	},

	sendReady: function(username, code) {
		var me = this;

		var msg = {
			event_name: me.events.player_ready,
			username: username,
			code: code
		};
		return me._send(msg);
	},

	get_status: function() {
		var me = this;
		return me._socket ? me._socket.readyState : null;
	},

	on: function(event_name, func) {
		if (!eventHandler[event_name]) {
			eventHandler[event_name] = [];
		}

		eventHandler[event_name].push(func);
	},

	un: function(event_name, func) {
		if (eventHandler[event_name]) {
			var index = eventHandler[event_name].indexOf(func);
			eventHandler[event_name].splice(index, 1);
		}
	},

	trigger: function(event_name, data) {
		for (var i in eventHandler[event_name]) {
			var func = eventHandler[event_name][i];

			if (func) {
				func(data);
			}
		}
	},

	_message_received: function(msg) {
		console.log(msg);
	},

	_send: function(obj) {
		var me = this;

		var result = false;

		if (me._channel) {
			if (me._socket) {
				obj.channel = me._channel;

				var msg = JSON.stringify(obj);
				try {
					me._socket.send(msg);

					result = true;
				} catch (e) {
					console.error(e);
				}
			} else {
				console.error("not connected");
			}
		} else {
			console.error("no channel selected.");
		}

		return result;
	}

};