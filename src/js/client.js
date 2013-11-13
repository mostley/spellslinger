if (typeof(MF) === "undefined") {
	window.MF = {};
}

MF.Client = {
	events: {
		player_connected: 'player_connected',
		player_disconnected: 'player_disconnected', 
		player_code: 'player_code', 
		client_connected: 'client_connected',
		client_disconnected: 'client_disconnected',
		channel_list: 'channel_list'
	},

	eventHandler: {},

	host: "ws://localhost:81/",

	_socket: null,
	_channel: null,

	connect: function() {
		var me = this;

		var result = false;

		console.log("connecting to '" + me.host + "' ...");

    	try {
			me._socket = new WebSocket(me.host);

			me._socket.onopen = function() {
			    me.trigger(me.events.client_connected, me);
			};

			me._socket.onmessage = me._message_received.bind(me);
	  
	        me._socket.onclose = function() {
			    me.trigger(me.events.client_disconnected, me);
	        };

			console.log("... connected.");

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

	set_channel: function(channel) {
		var me = this;

		me._channel = channel;
	},

	request_channels: function() {
		var me = this;

		var msg = {
			event_name: me.events.channel_list
		};
		return me._send(msg);
	},

	send_code: function(username, code) {
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
		var me = this;

		if (!me.eventHandler[event_name]) {
			me.eventHandler[event_name] = [];
		}

		me.eventHandler[event_name].push(func);
	},

	un: function(event_name, func) {
		var me = this;

		if (me.eventHandler[event_name]) {
			var index = me.eventHandler[event_name].indexOf(func);
			me.eventHandler[event_name].splice(index, 1);
		}
	},

	trigger: function(event_name, data) {
		var me = this;

		for (var i in me.eventHandler[event_name]) {
			var func = me.eventHandler[event_name][i];

			if (func) {
				func(data);
			}
		}
	},

	_message_handler: {
		player_connected: function(msg) {
			var me = this;
			
		    me.trigger(me.events.player_connected, msg.data);
		},

		player_disconnected: function(msg) {
			var me = this;
			
		    me.trigger(me.events.player_disconnected, msg.data);
		},

		player_code: function(msg) {
			var me = this;
			
		    me.trigger(me.events.player_code, msg.data);
		},

		channel_list: function(msg) {
			var me = this;
			
		    me.trigger(me.events.channel_list, msg.data);
		}
	},

	_message_received: function(msg) {
		var me = this;

		var msgData = JSON.parse(msg.data);
		console.log("Message received: ", msgData);

		if (me._message_handler[msgData.event_name]) {
			me._message_handler[msgData.event_name].apply(me, [msgData]);
		} else {
			console.warn('No handler for event "' + msgData.event_name);
		}
	},

	_send: function(obj) {
		var me = this;

		var result = false;

		if (me._channel || obj.event_name == 'channel_list') {
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