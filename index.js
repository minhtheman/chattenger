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
	let color = getRandomColor();
	socket.emit('new user check');
	
	socket.on('new user', function(){
		socket.color = color;
		let nickname = usernickname.choose();
		socket.username = nickname;
		allUsers.push({nickname: nickname, color: color});
		socket.emit('username notify', socket.username);
		socket.emit('chat history', chatHistory);
		socket.emit('user connected', nickname);
		socket.broadcast.emit('user connected', nickname);
		socket.emit('new cookie user', nickname, color);
		io.emit('user list', allUsers);
	});
	
	socket.on('new cookie', function(nickname){
		socket.username = nickname;
		socket.color = color;
		allUsers.push({nickname: nickname, color: color})
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
		
		if(msg.startsWith("/nickcolor ")){
			let test = msg.slice(11);
			if (isNaN(test)){
				socket.emit('error color');
			} else {
				socket.color = test;
			}
			for(let i = 0; i < allUsers.length; i++){
				if (allUsers[i].nickname === socket.name){
					allUsers[i].color = socket.color;
				}
			}
			io.emit('user list', allUsers);
			socket.emit('color change', socket.color);
		} else if (msg.startsWith("/nick ")){
			let oldName = socket.name;
			let nameTaken = false;
			socket.name = msg.slice(6);
			for (let i = 0; i < allUsers.length; i++){
				if (allUsers[i].nickname === socket.name){
					nameTaken = true;
				}
			}
			
			if (nameTaken){
				socket.emit('name taken', socket.name);
				socket.name = oldName;
			} else {
				for (let i = 0; i < allUsers.length; i++){
					if (allUsers[i].nickname === oldName){
						allUsers[i].nickname = socket.name;
					}
				}
				io.emit('user list', allUsers);
				socket.broadcast.emit('other user change', oldName, socket.name);
				socket.emit('changed cookie name', socket.name);
				socket.emit('nickname confirm', socket.name);
			}
		} else {
			if(chatHistory.length === 200){
				chatHistory.shift();
				fullHistory = true;
			}
			
			chatHistory.push({user: socket.username, color: socket.color, msg: msg});
			socket.broadcast.emit('chat message', timestamp, socket.color, socket.username, msg, fullHistory);
			socket.emit('bold chat message', timestamp, socket.color, socket.username, msg, fullHistory);
		}
	});
});

/* taken from: https://stackoverflow.com/questions/1484506/random-color-generator*/
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

http.listen(port, function(){
	console.log('listening on *:' + port);
});