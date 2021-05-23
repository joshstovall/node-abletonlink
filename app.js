const express 		= require('express');
const app			= express();
const http			= require('http');
const server 		= http.createServer(app);
const io			= require("socket.io")();
const abletonlink 	= require('abletonlink');

const link = new abletonlink(160.0, 4.0, false);

var tickInterval = 16;

link.startUpdate(tickInterval, (beat, phase, bpm) => distributeLink( beat, phase, bpm));

link.enable();
link.enablePlayStateSync();
link.isLinkEnable = true;

function distributeLink(beat, phase, bpm){
	io.emit('link', [beat, phase,bpm, link.quantum, tickInterval]);
}

app.use(express.static(__dirname + '/examples/'));

io.on('connection', (socket) => {

	socket.on('tempo', (e) => {
		link.bpm = parseFloat(e)
	});

	socket.on('interval', (e) => {
		tickInterval = e
		if(link.playState){
			link.stopUpdate()
			link.startUpdate(tickInterval, (beat, phase, bpm) => distributeLink( beat, phase, bpm))
		}
	});

	socket.on('quantum', (e) => {
		link.quantum = e
	});

	socket.on('start', (e) => {
		tickInterval = e
		link.playState = true
		link.startUpdate(tickInterval, (beat, phase, bpm) => distributeLink( beat, phase, bpm))
	});
		
	socket.on('stop', (e) => {
		link.stopUpdate()
		link.playState = false
	});
});

io.attach(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

server.listen(7777);
