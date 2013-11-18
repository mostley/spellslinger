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
		channel_list: 'channel_list',
		set_channel: 'set_channel',
		send_status: 'send_status',
		get_status: 'get_status',
		keep_alive: 'keep_alive',
		error: 'error'
	},

	eventHandler: {},

	_socket: null,
	_channel: null,
	_keey_alive_timer: null,
	_keep_alive_interval: 10000,

	connect: function() {
		var me = this;

		var result = false;

		var host = "ws://" + window.location.hostname + ":" + window.location.port  + "/";

		console.log("connecting to '" + host + "' ...");

    	try {
			me._socket = new ReconnectingWebSocket(host);

			me._socket.onopen = function() {
			    me.trigger(me.events.client_connected, me);
			};

			me._socket.onmessage = me._message_received.bind(me);
	  
	        me._socket.onclose = function() {
			    me.trigger(me.events.client_disconnected, me);
	        };

			console.log("... connected.");

			me._keey_alive_timer = window.setInterval(me._on_timeout.bind(me), me._keep_alive_interval);

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

	set_channel: function(name, is_private) {
		var me = this;

		var msg = {
			event_name: me.events.set_channel,
			data: {
				name: name,
				is_private: is_private
			}
		};

		return me._send(msg);

	},

	select_channel: function(id) {
		var me = this;

		var msg = {
			event_name: me.events.set_channel,
			data: {
				id: id
			}
		};

		return me._send(msg);

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
			event_name: me.events.player_code,
			data: {
				username: username,
				code: code
			}
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

	stop_keepalive: function() {
		window.clearTimeout(me._keey_alive_timer);
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
		},

		set_channel: function(msg) {
			var me = this;

			me._channel = msg.data.id;
			me.userId = msg.userId;
			
		    me.trigger(me.events.set_channel, msg.data);
		},

		keep_alive: function(msg) {
			var me = this;
			
		    console.log("keep_alive", msg.data);
		},

		error: function(msg) {
			var me = this;

			console.error("Error Message received for '" + msg.data.event_name + "' event. Reason: '" + msg.data.reason + "'");
			
		    me.trigger(me.events.error, msg.data);
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

	_on_timeout: function() {
		var me = this;

		if (me._channel) {
			var msg = {
				event_name: me.events.keep_alive,
				data: {
					datetime: new Date()
				}
			};

			me._send(msg);
		}
	},

	_send: function(obj) {
		var me = this;

		var result = false;

		if (me._channel || obj.event_name == 'channel_list' || obj.event_name == 'set_channel') {
			if (me._socket) {
				obj.channel = me._channel;

				console.log("Message sent: ", obj);

				var msg = JSON.stringify(obj);
				try {
					me._socket.send(msg);

					result = true;
				} catch (e) {
					console.error(e);
				}
			} else {
				console.error("clienterror: not connected");
			}
		} else {
			console.error("clienterror: no channel selected for '" + obj.event_name + "' event.");
		}

		return result;
	}

};