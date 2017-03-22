// <!--
//
// CALEB TONY -ENWIN
// 100939996
// ASSIGNMENT3
//
// REFERENCES
// https://socket.io/get-started/chat/
// LECTURE NOTE code
// tutorial 7
-->



var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');

var clients = [];
var clientsId = [];
var usersArray = [];

http.listen(2406);

console.log("Chat server listening on port 2406");

var ROOT = "./public"


function handler(req, res) {

    //process the request
    console.log("Request for: " + req.url);
    var filename = ROOT + req.url;

    var code = 500;
    var data = "";
    if (fs.existsSync(filename)) {
        var stats = fs.statSync(filename);
        if (stats.isDirectory()) {
            filename += "index.html";
        }
        console.log("Getting file: " + filename);
        data = fs.readFileSync(filename);
        code = 200;

    } else {
        console.log("File not found");
        code = 404;
        data = fs.readFileSync(ROOT + "/404.html");
    }

    // content header
    res.writeHead(code, {
        'content-type': mime.lookup(filename) || 'text/html'
    });
    // write message and signal communication is complete
    res.end(data);
};

///on connection
io.on('connection', function(socket, username) {
    // console.log("whada");

    //new user event
    socket.on('new_user', function(username) {
        socket.clients = clients;           //clients array
        socket.clientsId = clientsId;           ///clients id array
        socket.username = username;             //username array
        var myself = socket.username;
        socket.clients.push(socket.username);       //add username to array
        socket.clientsId.push(socket.id);           //add user id  to array
        //console.log(socket.clients);
        //console.log(socket.clientsId);
        var user = {
            username: socket.username,
            blockedBy: []
        };
        usersArray.push(user);
        io.emit('new_user', {
            user: socket.username,
            users: socket.clients
        });
        //console.log(usersArray);
    });

///block event, contains a user being block and blocker and pushes the blocked user to blocked arrray
    socket.on('block', function(data) {
        var x = socket.clients.indexOf(data.blockedBy);
        for (var i = 0; i < usersArray.length; i++) {
            usersArray[i].blockedBy = removeDuplicates(usersArray[i].blockedBy);
            if (usersArray[i].username == data.blocked) {
                usersArray[i].blockedBy.push(data.blockedBy);
            }
            if (usersArray[i].username == data.blockedBy) {
                usersArray[i].blockedBy.push(data.blocked);
            }
        }
        io.sockets.connected[clientsId[x]].emit('block',{blocked: data.blocked});
        //console.log(JSON.stringify(usersArray, null, 4));
    });

///unblock event, contains a user being block and blocker and removes the blocked user from blocked arrray
    socket.on('unblock', function(data) {
        var x = socket.clients.indexOf(data.unblockedBy);
        console.log(data.unblockedBy + " has unblocked " + data.unblocked);
        for (var i = 0; i < usersArray.length; i++) {
            usersArray[i].blockedBy = removeDuplicates(usersArray[i].blockedBy);
            if (usersArray[i].username == data.unblocked) {
                usersArray[i].blockedBy.splice(i, 1);

            }
            if (usersArray[i].username == data.unblockedBy) {
                usersArray[i].blockedBy.splice(i, 1);
            }
        }
        io.sockets.connected[clientsId[x]].emit('unblock',{unblocked: data.unblocked});
        //console.log(JSON.stringify(usersArray, null, 4));
    });

///private message event, emits a message and sender to the reciever via their ID
    socket.on('privMessage', function(data) {
        // socket.message = data.message;
        // socket.sender = data.sender;
        var checkIfBlocked = false;
        for (var i = 0; i < usersArray.length; i++) {
            for (var j = 0; j < usersArray[i].blockedBy.length; j++) {
                usersArray[i].blockedBy = removeDuplicates(usersArray[i].blockedBy);
                if (usersArray[i].blockedBy[j] == (data.sender || data.reciever)) {
                    checkIfBlocked = true;
                }
            }
        }
        if (checkIfBlocked === false) {
            var x = socket.clients.indexOf(data.reciever);
            io.sockets.connected[clientsId[x]].emit('privMessage', {
                message: data.message,
                sender: socket.username
            });
        } else {
            console.log(data.sender + " has blocked " + data.reciever);
        }

    })


//disconnect event, remove the user from user array and send username of that user
    socket.on('disconnect', function() {
        var x = socket.clients.indexOf(socket.username);
        socket.index = x;
        io.emit('user_disconnect', {
            user: socket.username,
            index: socket.index
        });
        socket.clients.splice(x, 1);
        socket.clientsId.splice(x, 1);
        console.log(socket.clients);
        console.log(socket.clientsId);
        for (var i = 0; i < usersArray.length; i++) {
            if (usersArray[i].username === socket.username) {
                usersArray.splice(i, 1);
            }
        }
        //console.log(JSON.stringify(usersArray, null, 4));

    });

//send public message to all users
    socket.on('message', function(message) {
            io.emit('message', {
                username: socket.username,
                message: message
            });
    });
});

///removeDuplicates
function removeDuplicates(num) {
    var x;
    var len = num.length;
    var out = [];
    var obj = {};

    for (x = 0; x < len; x++) {
        obj[num[x]] = 0;
    }
    for (x in obj) {
        out.push(x);
    }
    return out;
}
