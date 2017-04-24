$(document).ready(function() {
    browserNotifyPermission()
    ////variables
    $('#privDiv').hide();
    var username = prompt("What is your name?");
    browserNotify('welcome ' + username)
    var userList = []; //unused
    var guest = []; //unused
    var print = 0;
    var socket = io();
    var clicked;
    var currElem;
    var clickDiv;
    var option;

    //when a user connects event, emit username
    socket.on('connect', function() {
        socket.emit('new_user', username);

    })


    //client side retrive data and update the site
    socket.on('new_user', function(data) {
        //intro message

        var message = timestamp() + ": " + data.user + " has entered the chatroom";
        $('#messages').append($('<li>').html(message));

        //filters user list, so a user name isnt show more than once when the page is refereshed
        for (var i = 0; i < data.users.length; i++) {
            exist = $('#listUsers li').filter(function() {
                return $(this).text() == data.users[i]
            }).length;
            if (!exist) {
                $('#listUsers').append($('<li>').text(data.users[i]));
            }
        }


        ///click users in userlist event
        $('#listUsers li').click(function(e) {
            clicked = $(this);
            currElem = clicked.text(); //the user that was clicked from the list
            // console.log(currElem);
            e.preventDefault();
            document.getElementById("myDropdown").classList.toggle("show");


            $('#myDropdown a').click(function(e) {
                e.preventDefault();
                clickDiv = $(this);
                option = clickDiv.text().trim(); //the click option from the dropdown
                //  console.log(option);

                //if statment for options clicked from dropdown menu
                if (option == "Block") {
                    $(clicked).css({
                        'text-decoration': 'line-through',
                        'color': 'red'
                    });
                    if (currElem === username) {
                        console.log(username + " You Can't Block Yourself 😞");
                        setTimeout(function() {
                            $(clicked).css({
                                'text-decoration': 'none',
                                'color': 'black'
                            });
                        }, 1500);
                    } else {
                        socket.emit('block', {
                            blocked: currElem,
                            blockedBy: username,
                        });
                        return;
                    }
                }

                if (option == "Unblock") {
                    $(clicked).css({
                        'text-decoration': 'none',
                        'color': 'black'
                    });
                    socket.emit('unblock', {
                        unblocked: currElem,
                        unblockedBy: username,
                    });
                    return;
                }
                var alerted = false;

                if (option == "Private Message") {
                    $('#privDiv').show();
                    $(clicked).css({
                        'text-decoration': 'none',
                        'color': 'black'
                    });
                    $('#hidePrivM').click(function() {
                        $('#privDiv').hide();
                    });
                    var privateMessage;
                    $('#sendPrivM').click(function() {
                        privateMessage = $('#privM').val();
                        socket.emit('privMessage', {
                            reciever: currElem,
                            sender: data.user,
                            message: privateMessage
                        });
                        $('#privM').val('');
                    });
                }
            });
        });
    });

    //private message event, sends a private message
    socket.on('privMessage', function(data) {
        if (data.message) {
            var message = "Private message from  " + data.sender.toUpperCase() + ": " + data.message;
            $('#messages').append($('<li>').html(message.fontcolor("blue")));
        }
    });


    //block event , sends a block notification to blocker
    socket.on('block', function(data) {

        var message = "<b>" + data.blocked.fontcolor("red").toUpperCase() + "</b>" + " has been blocked";
        $('#messages').append($('<li>').html(message));
    });

    //unblock event , sends notification to blocker
    socket.on('unblock', function(data) {

        var message = "<b>" + data.unblocked.fontcolor("red").toUpperCase() + "</b>" + " has been unblocked";
        $('#messages').append($('<li>').html(message));
    });

    // disconnect handler , sends a notification to all users and removes disconnected usr from list
    socket.on('user_disconnect', function(data) {
        var dis = " has disconnected. "
        var message = "<b>" + data.user.fontcolor("darkred") + "</b>" + dis.fontcolor("darkred");
        $('#messages').append($('<li>').html(message));

        var ulElem = document.getElementById('listUsers');
        // var len = $("#listUsers li").length;
        ulElem.removeChild(ulElem.childNodes[data.index + 1]);
    });

    //input message
    $('form').submit(function() {
        var message = $('#m').val();
        socket.emit('message', message);
        $('#m').val('').focus();
        return false;
    });

    //sends public message to all users
    socket.on('message', function(user) {
        addMessage(user.username, user.message);
    });

});

function browserNotifyPermission() {
    Push.Permission.request(() => {
        console.log('Subscribed user');
    },
    () => {
    });
}

function browserNotify(message) {
    Push.create(message)
}


function timestamp() {
    return new Date().toLocaleTimeString();
}

//add message function
function addMessage(username, message) {
    var text = "<b>" + (username).toUpperCase() + "</b> : " + message;
    $('#messages').append($('<li>').html(text));
}
