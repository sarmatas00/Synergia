const path = require('path');
const express = require('express')
//const http = require('http')
const moment = require('moment');
const socketio = require('socket.io');
const emoji = require('node-emoji');
const PORT = process.env.PORT || 3000;
const ysocketio= require("y-socket.io/dist/server").YSocketIO
const {spawn}= require('child_process');
const net = require('net');

const http = require('https');
const fs = require('fs');

const db=require('./dbOperations.js');



// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// This function takes a port number as input and returns a Promise
//that resolves to a boolean value indicating whether or not the port is in use.
//It gets called when synChat server runs more than one time
//to avoid multiple port usage and errors
const isPortInUse=(port)=>{
    return new Promise((resolve,reject)=>{
        const server= net.createServer();
        server.once('error',(err)=>{
            if(err.code==='EADDRINUSE'){
                resolve(true);
            }else{
                reject(err);
            }
        });
        server.once('listening',()=>{
            server.close();
            resolve(false);
        });
        server.listen(port);
    });
}

const app = express();
const server = http.createServer(serverConfig, app);

const io = socketio(server);

//initialize YJS document synchronization library over socketIO
const YSocketIO=new ysocketio(io)
YSocketIO.initialize()


app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};
let docs={};
let cursors=[];
let speakingTime={};

io.on('connect', socket => {

    socket.on("join room", (roomid, username) => {

        socket.join(roomid);
        socketroom[socket.id] = roomid;
        socketname[socket.id] = username;
        micSocket[socket.id] = 'on';
        videoSocket[socket.id] = 'on';
 
        if (rooms[roomid] && rooms[roomid].length > 0) {
            rooms[roomid].push(socket.id);
            speakingTime[roomid].push({username,id:socket.id,total:0,start:0});             //initiate speaking time for user
            db.storeSpeakingTime(roomid,username,0);                                        //store the initial time in db to update later
            socket.to(roomid).emit('message', `${username} joined the room.`, 'Bot', moment().format(
                "h:mm a"
            ));
            io.to(socket.id).emit('join room', rooms[roomid].filter(pid => pid != socket.id), socketname, micSocket, videoSocket,docs[roomid]);
        }
        else {
            speakingTime[roomid]=[{username,id:socket.id,total:0,start:0}];
            db.storeSpeakingTime(roomid,username,0);
            rooms[roomid] = [socket.id];
            
            io.to(socket.id).emit('join room', null, null, null, null,null);
        }
    
        io.to(roomid).emit('user count', rooms[roomid].length);
        
    });

    socket.on('action', msg => {
        if (msg == 'mute')
            micSocket[socket.id] = 'off';
        else if (msg == 'unmute')
            micSocket[socket.id] = 'on';
        else if (msg == 'videoon')
            videoSocket[socket.id] = 'on';
        else if (msg == 'videooff')
            videoSocket[socket.id] = 'off';

        socket.to(socketroom[socket.id]).emit('action', msg, socket.id);
    })

    socket.on('video-offer', (offer, sid) => {
        socket.to(sid).emit('video-offer', offer, socket.id, socketname[socket.id], micSocket[socket.id], videoSocket[socket.id]);
    })

    socket.on('video-answer', (answer, sid) => {
        socket.to(sid).emit('video-answer', answer, socket.id);
    })

    socket.on('new icecandidate', (candidate, sid) => {
        socket.to(sid).emit('new icecandidate', candidate, socket.id);
    })

    socket.on('message', (msg, username, roomid) => {
		msg=emoji.unemojify(msg, null);
		msg=emoji.emojify(msg, null);
        io.to(roomid).emit('message', msg, username, moment().format(
            "h:mm a"
        ));
    })

    

    socket.on('getCanvas', () => {
        if (roomBoard[socketroom[socket.id]])
            socket.emit('getCanvas', roomBoard[socketroom[socket.id]]);
    });

    socket.on('draw', (newx, newy, prevx, prevy, color, size) => {
        socket.to(socketroom[socket.id]).emit('draw', newx, newy, prevx, prevy, color, size);
    })

    socket.on('clearBoard', () => {
        socket.to(socketroom[socket.id]).emit('clearBoard');
    });

    socket.on('store canvas', url => {
        roomBoard[socketroom[socket.id]] = url;
    })

    socket.on('update',room=>{

        let ret=[];
        for(let sid in socketroom){
            console.log(sid);
            if(socketroom[sid]===room){
                ret.push(sid);
                console.log(sid," in ",room);

            }
        }
        console.log("loop done ",ret);
        socket.to(room).emit('updatedSid',ret);
    })

    socket.on('disconnect', () => {
        if (!socketroom[socket.id]) return;
        socket.to(socketroom[socket.id]).emit('message', `${socketname[socket.id]} left the chat.`, `Bot`, moment().format(
            "h:mm a"
        ));
        socket.to(socketroom[socket.id]).emit('remove peer', socket.id);
        var index = rooms[socketroom[socket.id]].indexOf(socket.id);
        rooms[socketroom[socket.id]].splice(index, 1);
        io.to(socketroom[socket.id]).emit('user count', rooms[socketroom[socket.id]].length);
        console.log('--------------------');
        

        if(!rooms[socketroom[socket.id]].length){               //remove document info and cursor locations when room has emptied
            cursors=cursors.filter(cursor=>cursor.roomid!==socketroom[socket.id])
            delete docs[socketroom[socket.id]]
            db.deleteEmojis(socketroom[socket.id]);
            
        }else{
            if(cursors.some((cursor)=>cursor.socketID===socket.id)){            //if a user exits but the room still exists
                socket.to(socketroom[socket.id]).emit('remove user cursor',cursors.find((cursor)=>cursor.socketID===socket.id).id)          //find cursor info and broadcast it to other users to remove it
                cursors=cursors.filter((cursor)=>cursor.socketID!==socket.id)       //also remove it from cursors array
            }

        }
        
        delete socketroom[socket.id];

        
    });

    socket.on('saveEmojis',(detection,roomid)=>{
        db.saveEmojis(roomid,detection);
    })

    //when room gets created, store new document data to emit to other users
    socket.on('store-doc',(docData)=>{
        const {doc,type,provider,roomid}=docData;
        docs[roomid]={doc,type,provider};
        
    })

    //for every user change in the editor, this event tracks the new pointer location in the editor
    //and emits it to all the other users in the room in order to support multiple cursors
    socket.on('cursor location',(roomid,id,range,oldRange)=>{
        if(cursors.find(cursor=>cursor.id===id) && range!==oldRange){               //if the cursor exists already and we have a new location
            cursors=cursors.map(cursor=>cursor.id===id?{roomid,id,range,socketID:socket.id,hasMoved:true}:cursor)         //alter cursors array with the new location
        }else{                                                                      //register new cursor if a user has just started using the editor
            cursors.push({roomid,id,range,socketID:socket.id,hasMoved:false})
        }

        if(range!==oldRange){                                                   //send the new location to the other users
            socket.to(socketroom[socket.id]).emit('update cursors',cursors.filter(cursor=>cursor.roomid===roomid))
        }
    })

    socket.on('detect-speaker',async (roomid,isSpeaking)=>{                           //transmit to users in a room who is currently speaking
        /*first find the index of user in speakingTime object to retrive his total speaking time */
        if(speakingTime[roomid]){
                const index=speakingTime[roomid].findIndex(user=>user.username===socketname[socket.id]);
            if(isSpeaking){                                     //when he starts speaking, start measuring time
                speakingTime[roomid][index].start=Date.now();
            }else{                                              //when he stops speaking
                speakingTime[roomid][index].total+=Math.floor((Date.now()-speakingTime[roomid][index].start)/1000);             //add time he spoke to total time in seconds 
                if(speakingTime[roomid].reduce((prev,cur)=>{return prev+cur.total},0)/5>=1){                              //calculate if all users in room have 10 been speaking for 10 minutes
                    warnUsers(speakingTime[roomid]);                                                            //warn the users that speak a lot and little
                    speakingTime[roomid].forEach((user)=>{                                                      //update db with the times for each user and restart 10 minutes tracking for the room
                        db.updateSpeakingTime(roomid,user.username,user.total);
                        user.total=0;
                    });
                }
                io.to(roomid).emit("get statistics",await stats(roomid));                                       //update statistics panel with new total speaking time
            }
 
        }
        if(rooms[roomid]){
            socket.to(roomid).emit('detect-speaker', rooms[roomid].filter(pid => pid == socket.id),isSpeaking)              //transmit the sid of user speaking
        }
    })

    /*activated when user wants to view statistics panel */
    socket.on("get statistics",async (roomid)=>{
        socket.emit("get statistics",await stats(roomid));
    })

    /*calculate total speaking time for each user in a room and return it */
    async function stats(roomid){
        let time=[];
        if(speakingTime[roomid]){
            await Promise.all(speakingTime[roomid].map(async (user)=>{
                const pastTime=(await db.getSpeakingTime(roomid,user.username)).time;
                time.push({username:user.username,total:user.total+pastTime});
            }))
            return time;
        }else{
            return null;
        }
    }

    /*this function takes all speaking times for users in a room and calculated the percentage
    that every user has spoken the last 10 minutes. Emit a message to speak more to the users that have less than 25% speaking time
    and a message to speak more to users that have more than 75% speaking time */
    function warnUsers(speakingTime){
        const sum = speakingTime.reduce((prev,cur)=>{return prev+cur.total},0);
        let percentages=[];
        for(let i=0;i<speakingTime.length;i++){
            percentages.push((speakingTime[i].total/sum)*100);
            if(percentages[i]<25){
                const speakingMuch=false;
                io.to(speakingTime[i].id).emit("warn speaking",speakingMuch);
            }else if(percentages[i]>75){
                const speakingMuch=true;
                io.to(speakingTime[i].id).emit("warn speaking",speakingMuch);
            }
        }
        
    }

    
    
})
// This route handles the request to start the synChat server
//when the user wants to enter synChat
app.get('/start-chat-server',async (req,res)=>{
    // Check if the second server is already running
    const isRunning = await isPortInUse(3001);
    if (isRunning) {
        console.log('The chat server is already running');
    } else {
        // If the server is not running, start it by spawning a new child process and running 'npm start'
        const child = spawn('npm',['start'],{
            cwd:path.join(__dirname,'synChat'),
            shell:true,
            stdio:'inherit',
        })

        // Once the child process exits, log the exit code to the console
        child.on('close',(code)=>{
            console.log(`process exited with code ${code}`);
        })
    }
    res.sendStatus(200);
});




server.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));