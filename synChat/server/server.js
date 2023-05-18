const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const SocketIOFile = require('socket.io-file');

const {generateMessage, generateLocationMessage,generateFiles} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');

//get database configuration
const db = require('../../dbOperations.js');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const users = new Users();
const groups={};
let restartGroup={},restart={};

app.use(express.static(publicPath));

app.get('/:file(*)', function(req, res, next){ // this routes all types of file

    let path=require('path');

    const file = req.params.file;

    path = path.resolve(".")+'/'+file;
    res.download(path); // magic of download fuction

});
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join',async (params, callback) => {
        if (!isRealString(params.name) || !isRealString(params.room)) {
            return callback('Name and room name are required.');
        }
        
        if(users.getUsersByName(params.name).length){
            return callback('This username is already in use.');
        } 
        /*if the user has refreshed the page, we clear the timeout that archives the room's chat messages */
        if(restart[params.room]){
            clearTimeout(restart[params.room]);
            delete restart[params.room];
        }
        /*if the user has refreshed the page, we clear the timeout that emits the message that he disconnected to
        the othe users of the room */
        if(restart[params.name]){
            clearTimeout(restart[params.name]); 
            delete restart[params.name];
        }

        /*if the user has refreshed the page, we clear the timeouts that remove him from the groups
        or delete the groups */
        if(restartGroup[params.name]){
            restartGroup[params.name].forEach((timeout)=>clearTimeout(timeout))
            delete restartGroup[params.name];
        }

        socket.join(params.room);
        users.removeUser(socket.id); 
        users.addUser(socket.id, params.name, params.room);
        
        io.to(params.room).emit('updateUserList', users.getUserList(params.room),groups);
        socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
        
        
        const messages=await db.getMessages(params.room);                   //get all the stored messages for that chatroom
        let found=false;
        /*if there are any messages, we try to display them to the user on the page again if he has refreshed the page,
        or returns to the room a little later, provided it still exists.
        For each user though, we only send back the messages that he started seeing after he first logged into the chat
        */
        if(messages){
            Object.values(messages).forEach(msg=>{
                if(found){
                    socket.emit('newMessage',generateMessage(msg.from,msg.text));
                }
                if(msg.text.includes(params.name)){
                    found=true;
                }
            }); 
        }
        /*if the current user is new to the chat, emit the welcome message to others and store
        it in the db to have a record of when he entered
        */
        if(!found){
            socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined.`));
            db.storeMessage(generateMessage('Admin', `${params.name} has joined.`),params.room);
        }
        callback();
    });

    socket.on('createMessage',async (message, callback) => {
        const user = users.getUser(socket.id);

        //If user is the new message does not come from a group chat, emit back only the message
        if (user && isRealString(message.text) && !message.isGroupChat) {
            db.storeMessage(generateMessage(user.name, message.text),user.room);                //store each message in the room's mainChat db
            io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
        }else if(user && isRealString(message.text) && message.isGroupChat){                    //if is its a group chat message
            /*get all group messages for this room from db*/
            const groupMessages = await db.getGroupMessages(user.room,message.groupID);
            if(groupMessages){                                                     
                    await db.storeGroupMessage(generateMessage(user.name, message.text),user.room,message.groupID);                 //find and emit all the messages of that group
                
            }
            io.to(user.room).emit('notifyUserGroup',await getGroupUsersMessages(user,{id:message.groupID}));
        }
        
        callback(); 
    });
	
	 socket.on('userpresence', (message) => {
        const user = users.getUser(socket.id);

        if (user ) {
            io.to(user.room).emit('useronoff', message);
			
        }

        
    });
	// && isRealString(message.text)
    socket.on('createPrivateMessage', (message) => {
                    socket.broadcast.to(message.userid).emit('newPrivateMessage',{
           message:message.message,
           user:users.getUser(socket.id)
                    });
       
    });
    socket.on('privateMessageWindow', (userid) => {
        const user = users.getUser(socket.id);
        console.log(userid);
        socket.broadcast.to(userid.id).emit('notifyUser',{
            user:users.getUser(socket.id),
            otherUser:userid.id
        });
    });
    socket.on('private_connection_successful',(user) => {
        console.log(user.otherUserId);
        socket.broadcast.to(user.user.id).emit('openChatWindow',{
            user:users.getUser(user.otherUserId)
        });
    });
    socket.on('privateMessageSendSuccessful',function (message) {
        console.log(users.getUser(socket.id));
        const message_object ={
            message:message.message,
            user:users.getUser(message.userid),
            id:socket.id
        }
        socket.broadcast.to(message.userid).emit('privateMessageSuccessfulAdd',message_object);
    });
    socket.on('createLocationMessage', (coords) => {
        const user = users.getUser(socket.id);

        if (user) {
            io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
        }
    });
    //This part is for uploading file
    const uploader = new SocketIOFile(socket, {
        // uploadDir: {			// multiple directories
        // 	music: 'data/music',
        // 	document: 'data/document'
        // },
        uploadDir: 'data',							// simple directory,		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
        maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
        chunkSize: 10240,							// default is 10240(1KB)
        transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
        overwrite: true 							// overwrite file if exists, default is true.
    });
    uploader.on('start', (fileInfo) => {
        console.log('Start uploading');
        console.log(fileInfo);
    });
    uploader.on('stream', (fileInfo) => {
        console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
    });
    uploader.on('complete', (fileInfo) => {
        console.log('Upload Complete.');
        console.log(fileInfo);
    });
    uploader.on('error', (err) => {
        console.log('Error!', err);
    });
    uploader.on('abort', (fileInfo) => {
        console.log('Aborted: ', fileInfo);
    });
    socket.on('newFileMessage',(fileInfo) =>{
        const user = users.getUser(socket.id);
        console.log(user);
        if (user) {
            io.to(user.room).emit('newFileMessage', generateFiles(user.name, fileInfo.name));
        }
    });
    socket.on('newPrivateFileMessage',(info) =>{
       const user = users.getUser(socket.id);
       console.log(user);
       console.log(info.fileinfo);
       socket.broadcast.to(info.userid).emit('newPrivateFileMessage',{
           user:user,
           fileinfo:info.fileinfo
       });
    });
    socket.on('privateFileSendSuccessful', (info) =>{
        const user = users.getUser(info.user.id);
        socket.broadcast.to(info.user.id).emit('privateFileSendSuccessful',{
           filename:info.fileinfo.name,
           user:user,
           id:socket.id
        });
    });
    socket.on('createPrivateLocationMessage',(coords) =>{
        const user = users.getUser(socket.id);
        const location = generateLocationMessage(user.name,coords.latitude,coords.longitude);
        socket.broadcast.to(coords.userid).emit('newPrivateLocationMessage', {
            location:location,
            user:user
        });
    });
    socket.on('locationMessageSuccessful',(message) =>{
        const newMessage ={
            message:message,
            id:socket.id
        }
        socket.broadcast.to(message.user.id).emit('locationMessageSuccessful',newMessage);
    });
    socket.on('initializeAudioCall', (userid) =>{
        const user = users.getUser(socket.id);
       socket.broadcast.to(userid).emit('incomingCall',user); 
       console.log(userid);
    });
    socket.on('initializeVideoCall', (userid) =>{
       const user = users.getUser(socket.id);
       socket.broadcast.to(userid).emit('incomingVideoCall',user);
    });
    socket.on('callReceived', (userid) =>{
       socket.broadcast.to(userid).emit('notifyCallReceived'); 
    });
    socket.on('videoCallReceived', (userid) =>{
        socket.broadcast.to(userid).emit('notifyVideoCallReceived');
    });
    socket.on('audioCall', (stream) =>{
        socket.broadcast.to(stream.userid).emit('onAudioCall',stream.blob);
    });
    socket.on('videoCall', (stream) =>{
        socket.broadcast.to(stream.userid).emit('onVideoCall',stream.blob);
    })
    socket.on('callEnded', (userid) =>{
       const user = users.getUser(socket.id);
       socket.broadcast.to(userid).emit('callEnded',user);
       console.log(userid);
    });
    socket.on('videoCallEnded', (userid) =>{
       const user = users.getUser(socket.id);
       socket.broadcast.to(userid).emit('videoCallEnded',user);
       console.log(userid);
    });
    socket.on('userBusy', (userid) =>{
        socket.broadcast.to(userid).emit('userBusy');
    })
    socket.on('userVideoBusy', (userid) =>{
        socket.broadcast.to(userid).emit('userVideoBusy');
    });
    socket.on('callNotReceived', (userid) =>{
        socket.broadcast.to(userid).emit('callNotReceived');
    });
    socket.on('videoCallNotReceived', (userid) =>{
        socket.broadcast.to(userid).emit('videoCallNotReceived');
    })

    //when a user is typing something, emits the info to other users
    //to display a typing message on screen
    //If the user is currently typing in a group chat, emits the group name as well
    socket.on('userTyping',(isTypingInGroup,groupName)=>{
        const user = users.getUser(socket.id);
        io.to(user.room).emit('userTyping',user,{isTypingInGroup,groupName});

    })

    /* Creating a new group. Takes the group name and an array of user names / group members.
     It then creates a new object with the group name, user names, creator name, and room name.
    Finally, it emits an 'add group' event to all users in the same room as the creator, passing in
    the newly created group object */
    socket.on('create group',(groupName,userNames)=>{
        groups[groupName]={name:groupName,users:userNames,creator:users.getUser(socket.id).name,room:users.getUser(socket.id).room};
        io.to(users.getUser(socket.id).room).emit('add group',groups[groupName]);
    })

    
    /* Emits group chat messages and users related to a user in a group with name->userid */
    socket.on('messageGroupChat',async (userid) => {
        const user = users.getUser(socket.id);

        io.to(user.room).emit('notifyUserGroup',await getGroupUsersMessages(user,userid));
    });

    /*
    The function retrieves the list of users and messages for a specific group chat.
    It searches for the group using group name and user room and then gets the messages
    related to that group. If there still no messages (empty chat), it creates and pushes a
    welcoming message to the group chat in db
     */
    async function getGroupUsersMessages(user,userid){
        let groupUsers=[];
        let groupMsg=[];
        let Group="";
        let creator="";
        for(const group in groups){
            if(group===userid.id.split('-')[0] && groups[group].room==user.room){
                Group=group;
                groupUsers=groups[group].users;
                creator=groups[group].creator;

                const groupMessages = await db.getGroupMessages(user.room,group);
                if(!groupMessages){
                                                                          
                        await db.storeGroupMessage(generateMessage('Admin', 'Welcome to the chat app'),user.room,group);
                        groupMsg.push(generateMessage('Admin', 'Welcome to the chat app'));
                    
                }else{
                    groupMsg=Object.values(groupMessages);
                }
                
            }
        } 
        
        return {groupUsers, groupMsg,Group,creator};
    }

    /*when the creator of a group wants to delete it, archive all the group messages and remove it
    from the group list */
    socket.on('delete group',(group)=>{
        const user = users.getUser(socket.id);
        if(groups){
            db.archiveGroupChatroom(user.room,groups[group].name);
            delete groups[group];
        }
        io.to(user.room).emit('updateUserList', users.getUserList(user.room),groups);
    });
    

    socket.on('disconnect', () => {
        const user = users.removeUser(socket.id);
        /*filter out the disconnecting user from any groups he participates
        if he is the last member of any of these groups, also delete the group
        this happens 2 sec after he exits the room, which reverts the changes in case the member just refreshed the page */
        if(groups && user){
            restartGroup[user.name]=[];
            Object.keys(groups).forEach((group)=>{
                restartGroup[user.name].push(setTimeout(()=>{
                    groups[group].users=groups[group].users.filter(name=>name!==user.name)
                    if(!groups[group].users.length){
                        db.archiveGroupChatroom(user.room,groups[group].name);
                        delete groups.group; 
                    }
                },2000))
            })
        }
        console.log("User disconnected");

        /*when the last user in a room disconnects, we set a timeout to archive the
        room's messages. This gets done after 1 sec, to ensure the user has indeed left
        the room and has not refreshed the page
        */
        if(user && !users.getUserList(user.room).length){  
            restart[user.room]=setTimeout(()=>{db.archiveChatroom(user.room)},1000);
        }

        if (user) {
            io.to(user.room).emit('updateUserList', users.getUserList(user.room),groups);
            /*the info that we sent to other users that this user has left the room, might not be sent
            if the user has just refreshed his page
            */
            restart[user.name]=setTimeout(()=>{
                io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left.`));

            },1000)
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on ${port}`);
});
