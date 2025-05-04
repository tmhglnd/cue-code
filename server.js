// 
// cue-code
// Sequentially evaluate code from a timeline
//
// written by Timo Hoogland (c) 2025
// www.timohoogland.com
// 
// GNU GPL v3 LICENSE
// 

const banner = `
░▒█▀▀▄░▒█░▒█░▒█▀▀▀░░░░▒█▀▀▄░▒█▀▀▀█░▒█▀▀▄░▒█▀▀▀
░▒█░░░░▒█░▒█░▒█▀▀▀░▀▀░▒█░░░░▒█░░▒█░▒█░▒█░▒█▀▀▀
░▒█▄▄▀░░▀▄▄▀░▒█▄▄▄░░░░▒█▄▄▀░▒█▄▄▄█░▒█▄▄█░▒█▄▄▄
`;

const by = `
  ░██▄░▀▄▀░░░▀█▀░█▄▒▄█░█▄█░▄▀▒░█▒░░█▄░█░█▀▄
  ▒█▄█░▒█▒▒░░▒█▒░█▒▀▒█▒█▒█░▀▄█▒█▄▄░█▒▀█▒█▄▀
`

const subtitle = `
- SEQUENTIALLY EVALUATE CODE FROM A TIMELINE -
`

const { program } = require('commander');

const options = program
	.name('node server.js')
	.usage('[option] argument')
	.description('Sequentially evaluate code from a timeline')
	.option('-p, --port <number>', 'the port to receive your code on', '4880')
	.option('-a, --address <string>', 'the address to receive your code on', '/mercury-code')
	.option('-s, --serverport <number>', 'the port the server listens on', '8001')
	.option('-m, --mute <string>', 'the mute message to silence your sound with', 'silence')
	.parse(process.argv)
	.opts();

const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const { Client } = require('node-osc');

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = options.serverport;

app.use(express.static('.'));

app.get('/', (request, response) => {
	response.sendFile(join(__dirname + 'index.html'));
});

server.listen(port, () => {
	console.log(banner + by + subtitle);
	console.log(`Visit: http://localhost:${port}`);
});

io.on('connection', (socket) => {
	console.log('User connected, id:', socket.id);
	socket.emit('connected', socket.id);

	const client = new Client('127.0.0.1', options.port);
	console.log('Code will be send to:', options.address, 'at port:', options.port);

	socket.on('eval', (msg) => {
		console.log('Eval:', `${[msg]}`);
		client.send(options.address, msg);
	});

	socket.on('silence', (msg) => {
		console.log('Silenced');
		client.send(options.address, options.mute);
	});

	socket.on('disconnect', () => {
		console.log('User disconnected, id:', socket.id);
	});
});