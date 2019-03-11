var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var Moniker = require('moniker');
var usernickname = Moniker.generator([Moniker.adjective, Moniker.noun]);

var currTime;
var chatHistory = [];
var allUsers = [];

let fullHistory = false


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/chatstyle.css', function(req, res){
	res.sendFile(__dirname + '/chatstyle.css');
});

io.on('connection', function(socket){
	socket.emit('new user check');
	
	socket.on('new user', function(){
		let nickname = usernickname.choose();
		socket.username = nickname;
		allUsers.push({nickname: nickname});
		socket.emit('username notify', socket.username);
		socket.emit('chat history', chatHistory);
		socket.emit('user connected', nickname);
		socket.broadcast.emit('user connected', nickname);
		socket.emit('new cookie user', nickname);
		io.emit('user list', allUsers);
	});
	
	socket.on('new cookie', function(nickname){
		socket.username = nickname;
		allUsers.push({nickname: nickname})
		socket.emit('username notify', socket.username);
		socket.emit('chat history', chatHistory);
		socket.emit('user connected', nickname);
		socket.broadcast.emit('user connected', nickname);
		io.emit('user list', allUsers);
	});
	
	socket.on('disconnect', function(){
		let deletedUser = socket.username;
		socket.broadcast.emit('delete user', deletedUser);
		socket.emit('delete user', deletedUser);
		for(let i = 0; i < allUsers.length; i++){
			if(allUsers[i].nickname === socket.username){
				allUsers.splice(i, 1);
			}
		}
		io.emit('user list', allUsers);
	});
	
	socket.on('chat message', function(msg){
		currTime = new Date();
		let currHour = currTime.getHours();
		let currMin = (currTime.getMinutes()<10 ? '0' : '') + currTime.getMinutes();
		timestamp = currHour + ':' + currMin;
		
		if(chatHistory.length === 200){
			chatHistory.shift();
			fullHistory = true;
		}
		
		chatHistory.push({user: socket.username, msg: msg});
		socket.broadcast.emit('chat message', timestamp, socket.username, msg, fullHistory);
		socket.emit('bold chat message', timestamp, socket.username, msg, fullHistory);
	});
});



http.listen(port, function(){
	console.log('listening on *:' + port);
});