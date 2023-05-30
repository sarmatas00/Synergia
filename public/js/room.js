import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.5.53/+esm'
import {QuillBinding} from 'https://cdn.jsdelivr.net/npm/y-quill@0.1.5/+esm'
import {SocketIOProvider} from 'https://cdn.jsdelivr.net/npm/y-socket.io@1.1.0/+esm'
import QuillCursors from 'https://cdn.jsdelivr.net/npm/quill-cursors@4.0.2/+esm'
import * as yWeb from 'https://cdn.jsdelivr.net/npm/y-websocket@1.5.0/+esm'
import { gestures } from "./gestures.js"
const socket = io();
const myvideo = document.querySelector("#vd1");
const roomid = params.get("room");
let username;
let sd = 1;
let applyingChange = false;

let emoOn=false;
var handsOn=false;

let docs={};    
let editor={}                                     

const chatRoom = document.querySelector('.chat-cont');
const sendButton = document.querySelector('.chat-send');
const messageField = document.getElementById('chatinput');
const videoContainer = document.querySelector('#vcont');
const overlayContainer = document.querySelector('#overlay')
const continueButt = document.querySelector('.continue-name');
const nameField = document.querySelector('#name-field');
const videoButt = document.querySelector('.novideo');
const audioButt = document.querySelector('.audio');
const cutCall = document.querySelector('.cutcall');
const screenShareButt = document.querySelector('.screenshare');
const whiteboardButt = document.querySelector('.board-icon');
const textIcon = document.querySelector('.text-icon');
const inviteButt = document.getElementById('invite');
const raiseButt = document.getElementById('Raise_Hand');
const emojiDisp = document.getElementById('Emoji_Display');
const HandTrack=document.getElementById('HandTrack');
const chatButt = document.getElementById('chat');
const teamButt = document.getElementById('team');
const teamcont = document.getElementById('teamcont');
const nodisplaybutt = document.getElementById('nodisplay');
const textEditor = document.getElementById('editorParent');

//whiteboard js start
const whiteboardCont = document.querySelector('.whiteboard-cont');
const canvas = document.querySelector("#whiteboard");
const ctx = canvas.getContext('2d');


const chatInputEmoji = {
    '<3': '\u2764\uFE0F',
    '</3': '\uD83D\uDC94',
    ':D': '\uD83D\uDE00',
    ':)': '\uD83D\uDE03',
    ';)': '\uD83D\uDE09',
    ':(': '\uD83D\uDE12',
    ':p': '\uD83D\uDE1B',
    ';p': '\uD83D\uDE1C',
    ":'(": '\uD83D\uDE22',
    ':+1:': '\uD83D\uDC4D',
}; // https://github.com/wooorm/gemoji/blob/main/support.md


let boardVisisble = false;
let editorVisible = false;

whiteboardCont.style.visibility = 'hidden';

document.getElementById('room').style.display = "none";
document.getElementById('raiseHand').style.display = "none";
document.getElementById('rightcont').style.display = "none";
document.getElementById('rightcont2').style.display = "none";




let isDrawing = 0;
let x = 0;
let y = 0;
let color = "black";
let drawsize = 3;
let colorRemote = "black";
let drawsizeRemote = 3;

function fitToContainer(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

fitToContainer(canvas);

//getCanvas call is under join room call
socket.on('getCanvas', url => {
    let img = new Image();
    img.onload = start;
    img.src = url;

    function start() {
        ctx.drawImage(img, 0, 0);
    }


})

function setColor(newcolor) {
    color = newcolor;
    drawsize = 3;
}

function setEraser() {
    color = "white";
    drawsize = 10;
}

//might remove this
function reportWindowSize() {
    fitToContainer(canvas);
}

window.onresize = reportWindowSize;
//

function clearBoard() {
    if (window.confirm('Are you sure you want to clear board? This cannot be undone')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('store canvas', canvas.toDataURL());
        socket.emit('clearBoard');
    }
    else return;
}

socket.on('clearBoard', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
})

function draw(newx, newy, oldx, oldy) {
    ctx.strokeStyle = color;
    ctx.lineWidth = drawsize;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

    socket.emit('store canvas', canvas.toDataURL());

}

function drawRemote(newx, newy, oldx, oldy) {
    ctx.strokeStyle = colorRemote;
    ctx.lineWidth = drawsizeRemote;
    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.lineTo(newx, newy);
    ctx.stroke();
    ctx.closePath();

}

canvas.addEventListener('mousedown', e => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = 1;
})

canvas.addEventListener('mousemove', e => {
    if (isDrawing) {
        draw(e.offsetX, e.offsetY, x, y);
        socket.emit('draw', e.offsetX, e.offsetY, x, y, color, drawsize);
        x = e.offsetX;
        y = e.offsetY;
    }
})

window.addEventListener('mouseup', e => {
    if (isDrawing) {
        isDrawing = 0;
    }
})

socket.on('draw', (newX, newY, prevX, prevY, color, size) => {
    colorRemote = color;
    drawsizeRemote = size;
    drawRemote(newX, newY, prevX, prevY);
})

//whiteboard js end

//initialize quill editor
function loadQuill(){
    Quill.register('modules/cursors', QuillCursors)       //cursors for different users when editing
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
        // array for drop-downs, empty array = defaults
        [{ 'size': [] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['image', 'video'],
        ['clean'],                                         // remove formatting button
        ['save']                                          //save button
      ];
    
    editor=new Quill('#editor',{                   //editor setup
        theme:'snow',
        modules:{
            cursors:true,
            toolbar:toolbarOptions
        }
    })
    const textEditorSaveBtn = document.querySelector('.ql-save');               //configure button to save document data 
    setUpSaveBtn(textEditorSaveBtn)
    textEditorSaveBtn.addEventListener('click',(evt)=>btnSaveEvt(evt))
    
    const textEditorCloseBtn=document.querySelector('#ql-close')                //configure and style button that closes editor
    textEditorCloseBtn.innerHTML='<div class="nav-cancel is-active" id="nav-cancel"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg></div>'
    textEditorCloseBtn.addEventListener('click',()=>{textIcon.click()})
    
    fitToParent(textEditor.children[0],100,8)           //toolbar takes 8vh of the container
    fitToParent(textEditor.children[1],100,73)          //main editor takes 67vh of the container
    textEditor.style.visibility='hidden'                //make editor hidden at the beginning
    
}

function setMultipleCursors(){                              //setup new cursor when a user enters the room                               
    const cursors = editor.getModule("cursors");
    const id=`${roomid}-${username}`
    cursors.createCursor(id, username, getCursorColor(0));
    editor.on("selection-change", function (range, oldRange, source) {      //track cursor location changes
        if(range){
            cursors.moveCursor(id, range);                                  //move cursor to new location
            socket.emit('cursor location',roomid,id,range,oldRange)         //broadcast new location to other users
            if(editorVisible){                                              //cursor appears if editor is visible
                cursors.toggleFlag(id, true);
            }else{
                cursors.toggleFlag(id, false);

            }
        }
     });
}



socket.on('update cursors',(cursors)=>{                             //update cursors of other users that use the editor in real time
    const id=`${roomid}-${username}`
    const Cursors=editor.getModule("cursors")
    let colorIndex=1
    for(let cursor of cursors){
        if(cursor.id!==id && cursor.hasMoved){
            const Id=cursor.id
            const Range=cursor.range
            Cursors.createCursor(Id,[...Id].slice([...Id].indexOf('-')+1).join(''),getCursorColor(colorIndex++))
            Cursors.moveCursor(Id,Range); 
            if(editorVisible){
                Cursors.toggleFlag(Id, true);
            }else{
                Cursors.toggleFlag(Id, false);

            }
        }
    }
    
})

socket.on('remove user cursor',(oldID)=>{                           //remove cursor of a user that has exited the room
    const Cursors=editor.getModule("cursors")
    Cursors.removeCursor(
        Cursors.cursors().find(cursor=>cursor.id===oldID).id
    )
})


function hideUserCursors(){                                         //gets called when user closes editor to hide cursors from the screen
    const Cursors=editor.getModule("cursors")
    Cursors.cursors().forEach((cursor)=>{
        Cursors.toggleFlag(cursor.id,false)
    })
}

function fitToParent(element,width,height) {            //adjusts quill editors elements dimensions on page
    element.style.width = `${width}%`;
    element.style.height = `${height}vh`;
    element.width = element.offsetWidth;
    element.height = element.offsetHeight;
}


//create yjs document and connect it with a websocket provider
function loadDoc(){                 
    const doc = new Y.Doc()
    const provider = new yWeb.WebsocketProvider("wss://localhost:3000",roomid,doc)
    const type= doc.getText(roomid)

    return {type,provider,doc}
    
}

function getCursorColor(index) {                                        
    
    return ['blue', 'red', 'orange', 'green','orange','gray','beige','aqua','cyan','magenta'][index];
  }

  
    


//end quill initialization

//find the id of the video player that matches the user who is currently speaking and put a border in place 
//or remove it if the user has stopped speaking
socket.on('detect-speaker',(sid,isSpeaking)=>{
    if(isSpeaking){
        document.getElementById(sid[0]).style.border='3px solid #4ecca3'
    }else{
        document.getElementById(sid[0]).style.border='none'
    }
})


let videoAllowed = 1;
let nodispAllowed = 0;
let audioAllowed = 1;

let micInfo = {};
let videoInfo = {};
let raiseInfo ={};
let nodispInfo = {};

let videoTrackReceived = {};

let mymuteicon = document.querySelector("#mymuteicon");
mymuteicon.style.visibility = 'hidden';

let myvideooff = document.querySelector("#myvideooff");
myvideooff.style.visibility = 'hidden';

let vid = document.getElementById('vd1');
vid.style.visibility = 'visible';


const configuration = { iceServers: [{ urls: "stun:stun.stunprotocol.org" }] }

const mediaConstraints = { video: true, audio: true };

let connections = {};
let cName = {};
let user = {};
let audioTrackSent = {};
let videoTrackSent = {};
var rname;

let mystream, myscreenshare;



document.querySelector('.roomcode').innerHTML = `${roomid}`



chatButt.addEventListener('click', () => {
	
    
if ( document.getElementById('rightcont').style.display == "none")
	{
		document.getElementById('leftcont').style.width = "80%";
		document.getElementById('rightcont').style.display = "block";
	}
else 
   {
	  document.getElementById('leftcont').style.width = "100%";
	  document.getElementById('rightcont').style.display = "none"; 
	   
   }

})






inviteButt.addEventListener('click', () => {
	
    
    document.getElementById('room').style.display = "block";
    CopyClassText();

})




function CopyClassText() {

    var textToCopy = document.querySelector('.roomcode');
    var currentRange;
    if (document.getSelection().rangeCount > 0) {
        currentRange = document.getSelection().getRangeAt(0);
        window.getSelection().removeRange(currentRange);
    }
    else {
        currentRange = false;
    }

    var CopyRange = document.createRange();
    CopyRange.selectNode(textToCopy);
    window.getSelection().addRange(CopyRange);
    document.execCommand("copy");

    window.getSelection().removeRange(CopyRange);

    if (currentRange) {
        window.getSelection().addRange(currentRange);
    }

    document.querySelector(".copycode-button").textContent = "Copied!"
    setTimeout(()=>{
        document.querySelector(".copycode-button").textContent = "Copy Code";
    }, 5000);
	setTimeout(()=>{
        document.getElementById('room').style.display = "none";
    }, 5000);
}





continueButt.addEventListener('click', () => {
    if (nameField.value == '') return;
    username = nameField.value;
	teamcont.innerHTML +=  `<div class="username"> ${username} </div>` + '<br>';
    overlayContainer.style.visibility = 'hidden';
    document.querySelector("#myname").innerHTML = `${username} (You)`;
    socket.emit("join room", roomid, username);

})

// nameField.addEventListener("keyup", function (event) {                           //event keycodes are deprecated
//     if (event.keyCode === 13) {
//         event.preventDefault();
//         continueButt.click();
//     }
// });

window.addEventListener('keyup',(evt)=>{                                
    if(evt.code==='Enter' && evt.target==nameField){
        continueButt.click();

    }
})

socket.on('user count', count => {
    if (count > 1) {
        videoContainer.className = 'video-cont';
    }
    else {
        videoContainer.className = 'video-cont-single';
    }
})

let peerConnection;

function handleGetUserMediaError(e) {
    switch (e.name) {
        case "NotFoundError":
            alert("Unable to open your call because no camera and/or microphone" +
                "were found.");
            break;
        case "SecurityError":
        case "PermissionDeniedError":
            break;
        default:
            alert("Error opening your camera and/or microphone: " + e.message);
            break;
    }

}


function reportError(e) {
    console.log(e);
    return;
}


function startCall() {

    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(localStream => {
            myvideo.srcObject = localStream;
            myvideo.muted = true;

            localStream.getTracks().forEach(track => {
                for (let key in connections) {
                    connections[key].addTrack(track, localStream);
                    if (track.kind === 'audio')
                        audioTrackSent[key] = track;
                    else
                        videoTrackSent[key] = track;
                }
            })
            
            //initiate hark library (speech detection) for the first user who created the room
            initiateHark(localStream);
            

        })
        .catch(handleGetUserMediaError);


}

raiseButt.addEventListener('click', () => {
	
    
    if (document.getElementById('raiseHand').style.display == "none")
	{
        console.log(handsOn," and we inside true if")
        clicked=true;
			document.getElementById('raiseHand').style.display = "block";
            document.getElementById('raiseHand').style.visibility = "visible";
			rname = username;
            //document.getElementById(`imH`).src='img/raisedhand.png';
            
			socket.emit('action', 'raiseHand');
			
	}
	else 
	{
        clicked=false;
        console.log(handsOn," and we inside false if")
       	document.getElementById('raiseHand').style.display = "none";
           document.getElementById('raiseHand').style.visibility = "hidden";
		rname ='';
		socket.emit('action', 'raiseOff');
	
}
    

})


nodisplaybutt.addEventListener('click', () => {

  
		if (vid.style.visibility  == 'visible') {
        
			
			//nodisplaybutt.style.backgroundColor = "#4ECCA3";
           
			vid.style.visibility = 'hidden';
			socket.emit('action', 'dispOff');

		}
		else {
        
			vid.style.visibility = 'visible';
			socket.emit('action', 'dispOn');
			
			//nodisplaybutt.style.backgroundColor = "#393e46";
        
		}
	
})

let emojiSids=[];
function handleVideoOffer(offer, sid, cname, micinf, vidinf, raiseinf, nodispinf) {

    sd += 1 ;
	cName[sid] = cname;
	
    socket.emit('update',roomid);
    console.log('video offered recevied');
    micInfo[sid] = micinf;
    videoInfo[sid] = vidinf;
	raiseInfo[sid] = raiseinf;
	nodispInfo[sid] = nodispinf;
	
    connections[sid] = new RTCPeerConnection(configuration);

    connections[sid].onicecandidate = function (event) {
        if (event.candidate) {
            console.log('icecandidate fired');
            socket.emit('new icecandidate', event.candidate, sid);
        }
    };

    connections[sid].ontrack = function (event) {

        if (!document.getElementById(sid)) {
            console.log('track event fired')
            let vidCont = document.createElement('div');
            let newvideo = document.createElement('video');
			let ntag = document.createElement('div');
            let name = document.createElement('div');
			let emo = document.createElement('div');
			let raiseh= document.createElement('div');
            let muteIcon = document.createElement('div');
            let videoOff = document.createElement('div');
			let disp = document.createElement('div');
            videoOff.classList.add('video-off');
            muteIcon.classList.add('mute-icon');
			ntag.classList.add('nametag');
            //name.classList.add('nametag');
            name.innerHTML = `${cName[sid]}`;
			teamcont.innerHTML += `<div class="username">  ${cName[sid]}</div> `+ '<br>';
			//emo.classList.add('nametag');
            emo.innerHTML = ` <img id=\"emo${sid}\" src=\"img/neutral.png\" width=\"50px\" height=\"50px\">`;
			raiseh.innerHTML = ` <img id=\"raisePic${sid}\" src=\"img/raisedhand.png\" width=\"50px\" height=\"50px\">`;
            vidCont.id = sid;
            muteIcon.id = `mute${sid}`;
            videoOff.id = `vidoff${sid}`;
			raiseh.id = `raise${sid}`;
            muteIcon.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
            videoOff.innerHTML = 'Video Off'
            vidCont.classList.add('video-box');
            newvideo.classList.add('video-frame');
            newvideo.autoplay = true;
            newvideo.playsinline = true;
            newvideo.id = `video${sid}`;
			disp.id = `video${sid}`;
            newvideo.srcObject = event.streams[0];

            if (micInfo[sid] == 'on')
                muteIcon.style.visibility = 'hidden';
            else
                muteIcon.style.visibility = 'visible';

            if (videoInfo[sid] == 'on')
                videoOff.style.visibility = 'hidden';
            else
                videoOff.style.visibility = 'visible';
				
			if (raiseInfo[sid] == 'on')
                        raiseh.style.visibility = 'visible';
                    else
                        raiseh.style.visibility = 'hidden';
		    		
			if (nodispInfo[sid] == 'on')
                        newvideo.style.visibility = 'hidden';
                    else
                        newvideo.style.visibility = 'visible';	
            						
		   

            vidCont.appendChild(newvideo);
			vidCont.appendChild(ntag);
			ntag.appendChild(raiseh);
            ntag.appendChild(name);
			ntag.appendChild(emo);
			
            vidCont.appendChild(muteIcon);
            vidCont.appendChild(videoOff);

            videoContainer.appendChild(vidCont);
            //adding emoji functionality to the room
            emojiListener();
			
			
			
							
            
        }


    };

    connections[sid].onremovetrack = function (event) {
        if (document.getElementById(sid)) {
            document.getElementById(sid).remove();
            console.log('removed a track');
        }
    };

    connections[sid].onnegotiationneeded = function () {

        connections[sid].createOffer()
            .then(function (offer) {
                return connections[sid].setLocalDescription(offer);
            })
            .then(function () {

                socket.emit('video-offer', connections[sid].localDescription, sid);

            })
            .catch(reportError);
    };

    let desc = new RTCSessionDescription(offer);

    connections[sid].setRemoteDescription(desc)
        .then(() => { return navigator.mediaDevices.getUserMedia(mediaConstraints) })
        .then((localStream) => {

            localStream.getTracks().forEach(track => {
                connections[sid].addTrack(track, localStream);
                console.log('added local stream to peer')
                if (track.kind === 'audio') {
                    audioTrackSent[sid] = track;
                    if (!audioAllowed)
                        audioTrackSent[sid].enabled = false;
                }
                else {
                    videoTrackSent[sid] = track;
                    if (!videoAllowed)
                        videoTrackSent[sid].enabled = false
                }
            })

        })
        .then(() => {
            return connections[sid].createAnswer();
        })
        .then(answer => {
            return connections[sid].setLocalDescription(answer);
        })
        .then(() => {
            socket.emit('video-answer', connections[sid].localDescription, sid);
        })
        .catch(handleGetUserMediaError);


}

function handleNewIceCandidate(candidate, sid) {
    console.log('new candidate recieved')
    var newcandidate = new RTCIceCandidate(candidate);

    connections[sid].addIceCandidate(newcandidate)
        .catch(reportError);
}

function handleVideoAnswer(answer, sid) {
    console.log('answered the offer')
    const ans = new RTCSessionDescription(answer);
    connections[sid].setRemoteDescription(ans);
}

//Thanks to (https://github.com/miroslavpejic85) for ScreenShare Code

screenShareButt.addEventListener('click', () => {
    screenShareToggle();
});
let screenshareEnabled = false;
function screenShareToggle() {
    let screenMediaPromise;
    if (!screenshareEnabled) {
        if (navigator.getDisplayMedia) {
            screenMediaPromise = navigator.getDisplayMedia({ video: true });
        } else if (navigator.mediaDevices.getDisplayMedia) {
            screenMediaPromise = navigator.mediaDevices.getDisplayMedia({ video: true });
        } else {
            screenMediaPromise = navigator.mediaDevices.getUserMedia({
                video: { mediaSource: "screen" },
            });
        }
    } else {
        screenMediaPromise = navigator.mediaDevices.getUserMedia({ video: true });
    }
    screenMediaPromise
        .then((myscreenshare) => {
            screenshareEnabled = !screenshareEnabled;
            for (let key in connections) {
                const sender = connections[key]
                    .getSenders()
                    .find((s) => (s.track ? s.track.kind === "video" : false));
                sender.replaceTrack(myscreenshare.getVideoTracks()[0]);
            }
            myscreenshare.getVideoTracks()[0].enabled = true;
            const newStream = new MediaStream([
                myscreenshare.getVideoTracks()[0], 
            ]);
            myvideo.srcObject = newStream;
            myvideo.muted = true;
            mystream = newStream;
            screenShareButt.innerHTML = (screenshareEnabled 
                ? `<i class="fas fa-desktop"></i><span class="tooltiptext">Stop Share Screen</span>`
                : `<i class="fas fa-desktop"></i><span class="tooltiptext">Share Screen</span>`
            );
            myscreenshare.getVideoTracks()[0].onended = function() {
                if (screenshareEnabled) screenShareToggle();
            };
        })
        .catch((e) => {
            alert("Unable to share screen:" + e.message);
            console.error(e);
        });
}

socket.on('video-offer', handleVideoOffer);

socket.on('new icecandidate', handleNewIceCandidate);

socket.on('video-answer', handleVideoAnswer);
var sidsNames={};var local=username; 
if(username==null){
    username=nameField.value;
}
socket.on('updatedSid',(sids)=>{
    sids.forEach(sid=>{
        sidsNames[sid]=cName[sid]
    })
    local=username;
})


socket.on('join room', async (conc, cnames, micinfo, videoinfo, docInfo, raiseinfo, nodispinfo) => {
    socket.emit('getCanvas');
    if (cnames)
        cName = cnames;

    if (micinfo)
        micInfo = micinfo;

    if (videoinfo)
        videoInfo = videoinfo;
		
	if (raiseinfo)
        raiseinfo = raiseinfo;	
		
	if (nodispinfo)
        nodispinfo = nodispinfo;		
		
	 	

    /*QUILL EDITOR SETUP */
    loadQuill()                                                 //initiate quill editor
    const {type,provider,doc}=loadDoc()                         //load editor's config
    setMultipleCursors()                                        //set a cursor for the user in the editor
    const binding= new QuillBinding(type,editor,provider.awareness)                 //bind the editor to the websocket sever, to collaborate with other users
    docs[roomid]={doc,provider,type,binding}                    //store document info


    editor.on('text-change', function (delta) {                 //when a change is made in the editor, emit it to other users to update their editors
        if (!applyingChange) {
            socket.emit('editor-change', delta);
            socket.emit("store-editor-state",editor.getContents(),roomid);
        }
    });
      
      // Receive changes from the server and apply them to the local document
    socket.on('editor-change', function (delta) {
        applyingChange = true;
        editor.updateContents(delta);
        applyingChange = false; 
    });        

    //update editor to match other users'
    if(docInfo){
        applyingChange=true;
        editor.setContents(docInfo)
        applyingChange=false
    }
        
    

    
    

	
    if (conc) {
        await conc.forEach(sid => {
            connections[sid] = new RTCPeerConnection(configuration);

            connections[sid].onicecandidate = function (event) {
                if (event.candidate) {
                    console.log('icecandidate fired');
                    socket.emit('new icecandidate', event.candidate, sid);
                }
            };

            connections[sid].ontrack = function (event) {

                if (!document.getElementById(sid)) {
                    console.log('track event fired')
                    let vidCont = document.createElement('div');
                    let newvideo = document.createElement('video');
					let ntag= document.createElement('div');
                    let name = document.createElement('div');
					let emo = document.createElement('div');
					let raiseh = document.createElement('div');
                    let muteIcon = document.createElement('div');
                    let videoOff = document.createElement('div');
					let disp = document.createElement('div');
                    videoOff.classList.add('video-off');
                    muteIcon.classList.add('mute-icon');
					
                    ntag.classList.add('nametag');
                    name.innerHTML = `${cName[sid]}`;
					teamcont.innerHTML += `<div class="username">  ${cName[sid]}</div> ` + '<br>';
					
					//emo.classList.add('nametag');
					emo.innerHTML = ` <img id="emo${sid}" src=\"img/neutral.png\" width=\"50px\" height=\"50px\">`;
					raiseh.innerHTML = " <img src=\"img/raisedhand.png\" width=\"50px\" height=\"50px\">";
                    vidCont.id = sid;
                    muteIcon.id = `mute${sid}`;
                    videoOff.id = `vidoff${sid}`;
					raiseh.id = `raise${sid}`;
                    muteIcon.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
                    videoOff.innerHTML = 'Video Off'
                    vidCont.classList.add('video-box');
                    newvideo.classList.add('video-frame');
                    newvideo.autoplay = true;
                    newvideo.playsinline = true;
                    newvideo.id = `video${sid}`;
					disp.id = `video${sid}`;
                    newvideo.srcObject = event.streams[0];
					

                    if (micInfo[sid] == 'on')
                        muteIcon.style.visibility = 'hidden';
                    else
                        muteIcon.style.visibility = 'visible';

                    if (videoInfo[sid] == 'on')
                        videoOff.style.visibility = 'hidden';
                    else
                        videoOff.style.visibility = 'visible';
					
					if (raiseInfo[sid] == 'on')
                        raiseh.style.visibility = 'visible';
                    else
                        raiseh.style.visibility = 'hidden';
	
	                
					if (nodispInfo[sid] == 'on')
							newvideo.style.visibility = 'hidden';
						else
							newvideo.style.visibility = 'visible';	
					
                    vidCont.appendChild(newvideo);
					vidCont.appendChild(ntag);
					ntag.appendChild(raiseh);
                    ntag.appendChild(name);
					ntag.appendChild(emo);
					
					
                    vidCont.appendChild(muteIcon);
                    vidCont.appendChild(videoOff);

                    videoContainer.appendChild(vidCont);
                    //adding emoji functionality to the room
                    emojiListener();
                    
                    
		
					
					
					
					//raiseh.style = "display: none;";   
									
                    

                }

            };

            connections[sid].onremovetrack = function (event) {
                if (document.getElementById(sid)) {
                    document.getElementById(sid).remove();
                }
            }

            connections[sid].onnegotiationneeded = function () {

                connections[sid].createOffer()
                    .then(function (offer) {
                        return connections[sid].setLocalDescription(offer);
                    })
                    .then(function () {

                        socket.emit('video-offer', connections[sid].localDescription, sid);

                    })
                    .catch(reportError);
            };

        });

        console.log('added all sockets to connections');
        startCall();

    }
    else {
        console.log('waiting for someone to join');
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(localStream => {
                myvideo.srcObject = localStream;
                myvideo.muted = true;
                mystream = localStream;
                
                //initiate hark library (speech detection) for every other user that enters the room
                initiateHark(localStream);
            })
            .catch(handleGetUserMediaError);
    }
	
	 
})


teamButt.addEventListener('click', () => {
	
    
if ( document.getElementById('rightcont2').style.display == "none")
	{
		document.getElementById('leftcont').style.width = "80%";
		document.getElementById('rightcont2').style.display = "block";
		teamcont.scrollTop = teamcont.scrollHeight;
		
		//teamcont.innerHTML += '<div class="username"> ${cName} </div>';
		//teamcont.innerHTML= `${cName[sid]}`;
			
			
		
		
			
	}
else 
   {
	  document.getElementById('leftcont').style.width = "100%";
	  document.getElementById('rightcont2').style.display = "none"; 
	   
   }

})
let emojiSID=[];
socket.on('remove peer', sid => {
    if (document.getElementById(sid)) {
        document.getElementById(sid).remove();
    }
    //when user is removed his sid is also removed from the tracked sids for emoji func
    let tmp=emojiSID.indexOf(sid);
            if(tmp>-1){
                emojiSID.splice(tmp,1);
            }

    delete connections[sid];
})

sendButton.addEventListener('click', () => {
    const msg = messageField.value.trim();                              //if message is not empty string
    if(msg!==""){
        messageField.value = '';
        socket.emit('message', msg, username, roomid);
    }
})

// messageField.addEventListener("keyup", function (event) {                //event keycodes are deprecated
//     if (event.keyCode === 13) {
//         event.preventDefault();
//         sendButton.click();
//     }
// });

window.addEventListener('keyup',(evt)=>{                                
    if(evt.code==='Enter' && evt.target==messageField){
        sendButton.click();
    }
})

/*
// chat room emoji picker
let msgerEmojiPicker;


/**
 * Chat room buttons click event
 
function setChatRoomBtn() {
    // adapt chat room size for mobile
    setChatRoomAndCaptionForMobile();

    // open hide chat room
    chatRoomBtn.addEventListener('click', (e) => {
        if (!isChatRoomVisible) {
            showChatRoomDraggable();
        } else {
            hideChatRoomAndEmojiPicker();
            e.target.className = 'fas fa-comment';
        }
    });

    

    // show msger participants section
    msgerCPBtn.addEventListener('click', (e) => {
        if (!thereIsPeerConnections()) {
            return userLog('info', 'No participants detected');
        }
        msgerCP.style.display = 'flex';
    });

    // hide msger participants section
    msgerCPCloseBtn.addEventListener('click', (e) => {
        msgerCP.style.display = 'none';
    });

    // clean chat messages
    msgerClean.addEventListener('click', (e) => {
        if (chatMessages.length != 0) {
            return cleanMessages();
        }
        userLog('info', 'No chat messages to delete');
    });

    // save chat messages to file
    msgerSaveBtn.addEventListener('click', (e) => {
        if (chatMessages.length != 0) {
            return downloadChatMsgs();
        }
        userLog('info', 'No chat messages to save');
    });

    

    // Markdown on-off
    msgerMarkdownBtn.addEventListener('click', (e) => {
        isChatMarkdownOn = !isChatMarkdownOn;
        setColor(msgerMarkdownBtn, isChatMarkdownOn ? 'lime' : 'white');
    });

    

    
    

    // on input check 4emoji from map
    msgerInput.oninput = function () {
        for (let i in chatInputEmoji) {
            let regex = new RegExp(escapeSpecialChars(i), 'gim');
            this.value = this.value.replace(regex, chatInputEmoji[i]);
        }
        checkLineBreaks();
    };

    msgerInput.onpaste = () => {
        isChatPasteTxt = true;
        checkLineBreaks();
    };

    // clean input msg txt
    msgerCleanTextBtn.addEventListener('click', (e) => {
        cleanMessageInput();
    });

    // paste to input msg txt
    msgerPasteBtn.addEventListener('click', (e) => {
        pasteToMessageInput();
    });

   

    
}

/**
 * Emoji picker chat room button click event
 
function setChatEmojiBtn() {
    msgerEmojiBtn.addEventListener('click', (e) => {
        // prevent refresh page
        e.preventDefault();
        hideShowEmojiPicker();
    });
    // Add emoji picker
    const pickerOptions = {
        theme: 'dark',
        onEmojiSelect: addEmojiToMsg,
    };
    const emojiPicker = new EmojiMart.Picker(pickerOptions);
    msgerEmojiPicker.appendChild(emojiPicker);
}

/**
 * Add emoji to chat message
 
function addEmojiToMsg(data) {
    //console.log(data);
    msgerInput.value += data.native;
    hideShowEmojiPicker();
}

/**
 * Show msger draggable on center screen position
 
function showChatRoomDraggable() {
    playSound('newMessage');
    if (isMobileDevice) {
        buttonsBar.style.display = 'none';
        isButtonsVisible = false;
    }
    chatRoomBtn.className = 'fas fa-comment-slash';
    msgerDraggable.style.top = '50%';
    msgerDraggable.style.left = isMobileDevice ? '50%' : '25%';
    msgerDraggable.style.display = 'flex';
    isChatRoomVisible = true;
    setTippy(chatRoomBtn, 'Close the chat', 'right-start');
}
*/

socket.on('message', (msg, sendername, time) => {
    chatRoom.scrollTop = chatRoom.scrollHeight;
    chatRoom.innerHTML += `<div class="message">
    <div class="info">
        <div class="username">${sendername}</div>
        <div class="time">${time}</div>
    </div>
    <div class="content">
        ${msg}
    </div>
</div>`
});


/**
 * Hide chat room and emoji picker
 
function hideChatRoomAndEmojiPicker() {
    msgerDraggable.style.display = 'none';
    msgerEmojiPicker.style.display = 'none';
    msgerEmojiBtn.style.color = '#FFFFFF';
    chatRoomBtn.className = 'fas fa-comment';
    isChatRoomVisible = false;
    isChatEmojiVisible = false;
    setTippy(chatRoomBtn, 'Open the chat', 'right-start');
}

*/

videoButt.addEventListener('click', () => {

    if (videoAllowed) {
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = false;
        }
        videoButt.innerHTML = `<i class="fas fa-video-slash"></i>`;
        videoAllowed = 0;
        videoButt.style.backgroundColor = "#b12c2c";

        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = false;
                }
            })
        }

        myvideooff.style.visibility = 'visible';

        socket.emit('action', 'videooff');
    }
    else {
        for (let key in videoTrackSent) {
            videoTrackSent[key].enabled = true;
        }
        videoButt.innerHTML = `<i class="fas fa-video"></i>`;
        videoAllowed = 1;
        videoButt.style.backgroundColor = "#4ECCA3";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'video')
                    track.enabled = true;
            })
        }


        myvideooff.style.visibility = 'hidden';

        socket.emit('action', 'videoon');
    }
})





audioButt.addEventListener('click', () => {

    if (audioAllowed) {
        for (let key in audioTrackSent) {
            audioTrackSent[key].enabled = false;
        }
        audioButt.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
        audioAllowed = 0;
        audioButt.style.backgroundColor = "#b12c2c";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'audio')
                    track.enabled = false;
            })
        }

        mymuteicon.style.visibility = 'visible';

        socket.emit('action', 'mute');
    }
    else {
        for (let key in audioTrackSent) {
            audioTrackSent[key].enabled = true;
        }
        audioButt.innerHTML = `<i class="fas fa-microphone"></i>`;
        audioAllowed = 1;
        audioButt.style.backgroundColor = "#4ECCA3";
        if (mystream) {
            mystream.getTracks().forEach(track => {
                if (track.kind === 'audio')
                    track.enabled = true;
            })
        }

        mymuteicon.style.visibility = 'hidden';

        socket.emit('action', 'unmute');
    }
})

socket.on('action', (msg, sid) => {
    if (msg == 'mute') {
        console.log(sid + ' muted themself');
        document.querySelector(`#mute${sid}`).style.visibility = 'visible';
        micInfo[sid] = 'off';
    }
    else if (msg == 'unmute') {
        console.log(sid + ' unmuted themself');
        document.querySelector(`#mute${sid}`).style.visibility = 'hidden';
        micInfo[sid] = 'on';
    }
    else if (msg == 'videooff') {
        console.log(sid + 'turned video off');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'visible';
        videoInfo[sid] = 'off';
    }
    else if (msg == 'videoon') {
        console.log(sid + 'turned video on');
        document.querySelector(`#vidoff${sid}`).style.visibility = 'hidden';
        videoInfo[sid] = 'on';
    }
	 else if (msg == 'raiseHand') {
        console.log(sid + 'raise hand on');
        document.querySelector(`#raise${sid}`).style.visibility = 'visible';
        raiseInfo[sid] = 'on';
    }
	 else if (msg == 'raiseOff') {
        console.log(sid + 'raise hand off');
        document.querySelector(`#raise${sid}`).style.visibility = 'hidden';
        raiseInfo[sid] = 'off';
    }
	
	 else if (msg == 'dispOff') {
        console.log(sid + 'display off');
        document.querySelector(`#video${sid}`).style.visibility = 'hidden';
        nodispInfo[sid] = 'on';
    }
	else if (msg == 'dispOn')  {
        console.log(sid + 'display on');
        document.querySelector(`#video${sid}`).style.visibility = 'visible';
        nodispInfo[sid] = 'off';
    }
	
})

whiteboardButt.addEventListener('click', () => {
    if (boardVisisble) {
        whiteboardCont.style.visibility = 'hidden';
        boardVisisble = false;
    }
    else {
        hideUserCursors()
        textEditor.style.visibility = 'hidden';
        whiteboardCont.style.visibility = 'visible';
        boardVisisble = true;
        editorVisible = false;
    }
})

//when user clicks editor button make it hidden or visible
//also connect or disconnect the document socket provider accordingly
textIcon.addEventListener('click', () => {
    if (editorVisible) {
        hideUserCursors()
        textEditor.style.visibility = 'hidden';
        editorVisible = false;
    }
    else {
        whiteboardCont.style.visibility = 'hidden';
        textEditor.style.visibility = 'visible';
        editorVisible = true;
        boardVisisble = false;
    }
})

    //add elements to save button on editor's toolbar
    function setUpSaveBtn(target){
        if(target){
            const anchor=document.createElement('a')
            anchor.setAttribute('href','#')
            anchor.setAttribute('id','download')
            anchor.innerHTML='<i style="font-size:18px;color:black" class="fa">&#xf0c7;</i>'
            target.appendChild(anchor)
        }


    }


                        //save button on text editor to save document data as text file
    function btnSaveEvt(evt){
        const filename=`${username}.txt`;                                       //user's username as file name
        const content=editor.getContents().ops[0].insert;                       //editor content data
        const myFile=new Blob([content],{type:'text/plain'});
    
        window.URL = window.URL || window.webkitURL;
            const dlBtn = document.getElementById("download");
            dlBtn.setAttribute("href", window.URL.createObjectURL(myFile));
            dlBtn.setAttribute("download", filename);
    
    }

    



cutCall.addEventListener('click', () => {
    socket.emit('update');
    location.href = '/';
})


let statusIcons = {
 
 
    neutral: '2',
    happy: '3',
    sad: '4',
    angry: '5',
    fearful: '6',
    disgusted: '7',
    surprised: '8'
  }
  
var  intervalID="";

//Function for emoji display support
function emojiListener(){
    //Checks if emoji button listener has already been created with a html element
    let emoCheck=document.getElementById("emojisOn");
    
    //If the element hasnt been created before it's created now and the button listener is created
    if(emoCheck==null){
        let listenCheck=document.createElement('div')
        listenCheck.innerHTML="<i id=\"emojisOn\"></i>";
        document.getElementById("room").appendChild(listenCheck);
    //emoOn signals if the button toggle is on or off
    emoOn=false;
    //Emoji display button listener
    emojiDisp.addEventListener('click',()=>{

        //When emojis are turned off the faceAPI tracking interval is cleared and the emoji icons get a default value
        if(emoOn){
            console.log("emoji off");
            emoOn=false;
            startInterval(false);
            clearInterval(intervalID);
            intervalID=null;

            setTimeout(()=>{
                for(let sid in connections){
                    document.getElementById(`emo${sid}`).src="img/neutral.png";
                    console.log("neutralizing");
                }
                document.getElementById(`iml`).src="img/neutral.png";
                console.log("neutralized local");

            },1000)
            
        
           
            emojiSID=[];
        }  
        //Emoji tracking is turned on 
        else{
            emoOn=true;
            console.log("emoON")
            var detection=turnOnEmojis();

            //start tracking emotions
            setTimeout(()=>{
                startInterval(true,detection);
            },1000)
            

            
        } 
    })
    
}
}
emojiSID=[];


  


function turnOnEmojis(){

    let video="";
    let sids="";
    let ctr=0;
    if(local==null){local=document.getElementById('myname').innerText.replace(' (You)','');}
    var detection={};detection[local]={};
    detection[local]["surprised"]=0;detection[local]["scared"]=0;detection[local]["angry"]=0;detection[local]["sad"]=0;detection[local]["smile"]=0;detection[local]["disgust"]=0;
    //For every connected user we track his video and output the according emoji to his icon
    for(let sid in connections){
    console.log("Ctr ",++ctr);
    detection[cName[sid]]={};
    detection[cName[sid]]["surprised"]=0;detection[cName[sid]]["scared"]=0;detection[cName[sid]]["angry"]=0;detection[cName[sid]]["sad"]=0;detection[cName[sid]]["smile"]=0;detection[cName[sid]]["disgust"]=0;
    
    if(!emojiSID.includes(sid)){
    emojiSID.push(sid);
    video=document.getElementById(`video${sid}`);
    
    console.log("sid",sid,"  video",video);
    if(!intervalID){
        intervalID=setInterval(async () => 
        {
        if(emoOn){
            
        for(let sid in connections){
            video=document.getElementById(`video${sid}`);
            let emoRem=document.getElementById(`emo${sid}`);

            faceapi.loadTinyFaceDetectorModel('weights');
        faceapi.loadFaceLandmarkModel('weights');
        faceapi.loadFaceRecognitionModel('weights');
        faceapi.loadFaceExpressionModel('weights');
                    const detections = 
                    await faceapi.detectAllFaces(
                    video, 
                    new faceapi.TinyFaceDetectorOptions()
                    )
    
                    .withFaceExpressions();
        
                    
                      
                    if (detections.length > 0) 
                    {
          
                        detections.forEach(element => 
                        {
           
                            let status = "";
                            let valueStatus = 0.0;
                            for (const [key, value] of Object.entries(element.expressions)) {
                                if (value > valueStatus) 
                                {
                                    status = key
                                    valueStatus = value;
                                }
                            }
                        
            
                    
                            let source = "";
                            switch (statusIcons[status]) 
                            {
                                case '2': source="img/neutral.png";
                                break;
                                case '3': 
                                    source="img/smile.png";
                                    detection[cName[sid]]["smile"]++;
                                break;
                                case '4': 
                                    source="img/sad.png";
                                    detection[cName[sid]]["sad"]++;
                                break;
                                case '5': 
                                    source="img/angry.png";
                                    detection[cName[sid]]["angry"]
                                break;
                                case '6': 
                                    source="img/scared.png";
                                    detection[cName[sid]]["scared"]++;
                                break;
                                case '7':
                                     source="img/disgust.png";
                                     detection[cName[sid]]["disgust"]++;
                                break;
                                
                                case '8': 
                                source="img/surprised.png";
                                detection[cName[sid]]["surprised"]++;
                                break;
                                default: source="img/default.png";
                            }
                //alert("joined "+ status + " " + source);
                //let emo=document.getElementById("iml");
                //let emoLoc=document.getElementById("iml");
                //emoLoc.src=source;
                emoRem.src=source;
                
                
                //faceR.innerHTML = statusIcons[status];
                
                
                
                    });
            } else {
                console.log("No Faces")
                //face.innerHTML = statusIcons.default;
            }		
                
                    
        
                        
                    
                            
        }
        //same code for the local user
        
                    const detectionsLoc = 
                    await faceapi.detectAllFaces(
                    myvideo, 
                    new faceapi.TinyFaceDetectorOptions()
                    )
    
                    .withFaceExpressions();
        
                    
                      
                    if (detectionsLoc.length > 0) 
                    {
          
                        detectionsLoc.forEach(element => 
                        {
           
                            let status = "";
                            let valueStatus = 0.0;
                            for (const [key, value] of Object.entries(element.expressions)) {
                                if (value > valueStatus) 
                                {
                                    status = key
                                    valueStatus = value;
                                }
                            }
                        
            
                    
                            let source = "";
                            switch (statusIcons[status]) 
                            {
                                case '2': source="img/neutral.png";
                                break;
                                case '3': 
                                    source="img/smile.png";
                                    detection[local]["smile"]++;
                                break;
                                case '4': 
                                    source="img/sad.png";
                                    detection[local]["sad"]++;
                                break;
                                case '5': 
                                    source="img/angry.png";
                                    detection[local]["angry"]++;
                                break;
                                case '6': 
                                    source="img/scared.png";
                                    detection[local]["scared"]++;
                                break;
                                case '7':
                                     source="img/disgust.png";
                                     detection[local]["disgust"]++;
                                break;
                                
                                case '8': 
                                source="img/surprised.png";
                                detection[local]["surprised"]++;
                                break;
                                default: source="img/default.png";
                            
                            }
                //alert("joined "+ status + " " + source);
                //let emo=document.getElementById("iml");
                //let emoLoc=document.getElementById("iml");
                //emoLoc.src=source;
                let emoLoc=document.getElementById("iml");
                emoLoc.src=source;
                
                
                
                //faceR.innerHTML = statusIcons[status];
                
                
                
                    });
            } else {
                console.log("No Faces")
                //face.innerHTML = statusIcons.default;
            }		
                  
        }
        //code for the case that the interval hasnt yet shut down after emoji display is toggled off
        else
        {
            for(sid in connections){
                document.getElementById(`emo${sid}`).src="img/neutral.png";
                console.log("neutralizing");
            }
            document.getElementById(`iml`).src="neutral.png";
            console.log("neutralized local");
        } 
            }, 200);
        }
        
        }
    	
    }

    console.log("length ",emojiSID.length);
    return detection;
        
}



//testing code
//every x seconds we track each users emotions and do something with them
var detectionInterval;
function startInterval(toggle,detection){
//Emojis turned on for the first time or turned on again so detections of emotions are reset
if(toggle){
    for(let sid in connections){
       detection[cName[sid]]["surprised"]=0;detection[cName[sid]]["smile"]=0;detection[cName[sid]]["angry"]=0;detection[cName[sid]]["scared"]=0;detection[cName[sid]]["disgust"]=0;detection[cName[sid]]["sad"]=0;
    }
    detection[local]["surprised"]=0;detection[local]["smile"]=0;detection[local]["angry"]=0;detection[local]["scared"]=0;detection[local]["disgust"]=0;detection[local]["sad"]=0;
//every x seconds we track the users in the call emotions and do something with them
detectionInterval=setInterval(()=>{
    //use the info eg every 3000ms there are 20 detections
    for(let sid in connections){
        let emotionMajority="";let count=0;let localEmotion="";let localCount=0;
        for(const emotion in detection[cName[sid]]){
            console.log(`object ${emotion}: ${detection[cName[sid]][emotion]}`);
            if(detection[cName[sid]][emotion]>count){
                emotionMajority=emotion;
                count=detection[cName[sid]][emotion];
            }
            if(detection[local][emotion]>localCount){
                localEmotion=emotion;
                localCount=detection[local][emotion];
            }
            console.log("local ",local);
        }
        console.log(`${cName[sid]} has been feeling mostly ${emotionMajority} with a count of ${count}/20`);
        console.log(`local ${local} has been feeling mostly ${localEmotion} with a count of ${localCount}/20`);
        
        
    }
    if(local==null){local=document.getElementById('myname').innerText.replace(' (You)','');console.log(" i am locall ",local);}
    socket.emit('saveEmojis',detection,roomid,local);





    //every interval emotions are reset and loged to database 
    for(let sid in connections){
        detection[cName[sid]]["surprised"]=0;detection[cName[sid]]["smile"]=0;detection[cName[sid]]["angry"]=0;detection[cName[sid]]["scared"]=0;detection[cName[sid]]["disgust"]=0;detection[cName[sid]]["sad"]=0;
     }
     detection[local]["surprised"]=0;detection[local]["smile"]=0;detection[local]["angry"]=0;detection[local]["scared"]=0;detection[local]["disgust"]=0;detection[local]["sad"]=0;
    
},15000)
}else{
    if(detectionInterval){
        clearInterval(detectionInterval);
    }
}

}


//every time a user speaks and stops speaking send a notice to other users
//and at the same time put or remove a border from his video box
function initiateHark(localStream){
    const options={};
    const speechEvents=hark(localStream,options);
    speechEvents.on('speaking',()=>{
        socket.emit('detect-speaker',roomid,true)
        document.querySelector('.video-box').style.border='3px solid #4ecca3'
    })
    speechEvents.on('stopped_speaking',()=>{
        socket.emit('detect-speaker',roomid,false)
        document.querySelector('.video-box').style.border='none'
    })
}


//when user wants to enter synChat, make a request to the
//server to run the synChat server and then open the app
//on a new tab and navigate the user there
const syncChat=document.querySelector('[href="chat-link"]')
syncChat.addEventListener('click',async (evt)=>{
    evt.preventDefault();
    await fetch('/start-chat-server');
    window.open('http://localhost:3001','_blank');
})

/*displays a modal on the user's screen that has contributed to the conversation a lot or very little
the last 10 minutes. The modal goes away after 3 sec */
socket.on("warn speaking",(speakingMuch)=>{
    
    const modal = document.querySelector('#speakingModal');
    (speakingMuch)?modal.children[0].children[0].innerText="Μονωπολείς στη συζήτηση":modal.children[0].children[0].innerText="Είσαι ανενεργός στη συζήτηση";
    modal.style.display="block";
    setTimeout(()=>{
        modal.style.display='none';
    },3000)
})


const config = {
    video: { width: 640, height: 480, fps: 30 }
  }
  
  const landmarkColors = {
    thumb: 'red',
    index: 'blue',
    middle: 'yellow',
    ring: 'green',
    pinky: 'pink',
    wrist: 'white'
  }
  
  const gestureStrings = {
    'thumbs_up': '👍',
    'victory': '✌🏻',
    'rock': '✊️',
    'paper': '🖐',
    'scissors': '✌️',
    'dont': '🙅'
  }
  
  const base = ['Horizontal ', 'Diagonal Up ']
  const dont = {
    left: [...base].map(i => i.concat(`Right`)),
    right: [...base].map(i => i.concat(`Left`))
  }
  
  async function createDetector() {
    return window.handPoseDetection.createDetector(
      window.handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: "mediapipe",
        modelType: "full",
        maxHands: 2,
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`,
      }
    )
  }




handListener();

async function handListener(){
    let handCheck=document.getElementById("handsOn");
    
    //If the element hasnt been created before it's created now and the button listener is created
    if(handCheck==null){
        let listenCheck=document.createElement('div')
        listenCheck.innerHTML="<i id=\"handsOn\"></i>";
        document.getElementById("room").appendChild(listenCheck);
    //handsOn signals if the button toggle is on or off
    handsOn=false;
    //Hand tracking button listener
    HandTrack.addEventListener('click',async ()=>{

        
        if(handsOn){
            console.log("hands off");
            handsOn=false;
            //startInterval(false);
            //clearInterval(intervalID);
            //intervalID=null;
            
            document.getElementById('raiseHand').style.display = "none";
           
        }  
        //Hand tracking is turned on 
        else{
           
            
            handsOn=true;
            console.log("handsOn");
            /*
            handTracking(myvideo);
            for(let sid in connections)
                handTracking(document.getElementById(`video${sid}`));
            //var detection=turnOnEmojis();
            */
            const knownGestures = [
                fp.Gestures.VictoryGesture,
                fp.Gestures.ThumbsUpGesture,
                ...gestures
              ]
            const detector1 = await createDetector()
            
            const GE = new fp.GestureEstimator(knownGestures)  
            
           
           handTracking(myvideo,document.getElementById("raiseHand"),detector1,GE,false);
          
          for(let sid in connections){
            let detector=await createDetector();
            handTracking(document.getElementById(`video${sid}`),document.getElementById(`raise${sid}`),detector,GE,false);
            document.getElementById(`raise${sid}`).style.display = "block";
            document.getElementById(`raise${sid}`).style.visibility='visible';
          }
          
        
        document.getElementById(`raiseHand`).style.display="block";
        document.getElementById(`raiseHand`).style.visibility='visible'; 
            
           
                  
               
            
            
            

        }         
})
    }
}

var clicked=false;;

async function handTracking(video,element,detector,GE){
    
   
    //const ctx = canvas.getContext("2d")
    
  // configure gesture estimator
  // add "✌🏻" and "👍" as sample gestures
  const estimateHands = async () => {

    

    // get hand landmarks from video
    const hands = await detector.estimateHands(video, {
      flipHorizontal: true
    })

    for (const hand of hands) {
      for (const keypoint of hand.keypoints) {
        const name = keypoint.name.split('_')[0].toString().toLowerCase()
        const color = landmarkColors[name]
        
      }

      const keypoints3D = hand.keypoints3D.map(keypoint => [keypoint.x, keypoint.y, keypoint.z])
      const predictions = GE.estimate(keypoints3D, 9)
      
      if (predictions.gestures.length > 0) {

        const result = predictions.gestures.reduce((p, c) => (p.score > c.score) ? p : c)
        const found = gestureStrings[result.name]
        // find gesture with highest match score
        const chosenHand = hand.handedness.toLowerCase()
        

        
          if(found===gestureStrings.paper ){
            if(!clicked){
            console.log("wanna raise");
            
            socket.emit('action', 'raiseHand');
            clicked=true;
           element.innerHTML='<img  width="50" height="50" src="img/raisedhand.png"> '
            
            
            }
          }else{
            if(clicked){
                console.log("stop raise");
                socket.emit('action', 'raiseHand');
                raiseButt.click();
                clicked=false;
                element.innerText = found;
            }else{
                element.innerText = found;
              }
          }
          
          continue
        
        checkGestureCombination(chosenHand, predictions.poseData,element)
      }

    }
    // ...and so on

    
    if(handsOn){
        setTimeout(() => { estimateHands() }, 1000 / config.video.fps)
    }else{
        element.style.visibility='hidden';
        console.log("turning off element is ",element.id, element.id==="raiseHand");
        
        if(element.id==='raiseHand'){
            element.innerHTML=`<img width="50" height="50"src="img/raisedhand.png">`;

        }else{
            let sid=element.id.replace('raisePic','');
            element.innerHTML=`<img id="raisePic${sid}" width="50" height="50"src="img/raisedhand.png">`;
        }
        
    }
  }
  setTimeout(()=>{
    estimateHands();
  },250);
  
  console.log("Starting predictions")
}



    



  
  const pair = new Set();

function checkGestureCombination(chosenHand, poseData,resultLayer) {
    const addToPairIfCorrect = (chosenHand) => {
      const containsHand = poseData.some(finger => dont[chosenHand].includes(finger[2]))
      if(!containsHand) return;
      pair.add(chosenHand)
    }

    addToPairIfCorrect(chosenHand)
    if(pair.size !== 2) return;
    
    resultLayer=document.getElementById("raiseHand");
    resultLayer.innerText = gestureStrings.dont
    pair.clear();
}


/*Statictics screen display when option in settings is clicked.
A box appears in the center of the screen, where information regarding total speaking
time of users in the room, as well as emotions are displayed. This info is refreshed every
time a user stops speaking, or when he clicks the button to view the info */
const statBtn = document.querySelector("a[href='stats']");
const statScreen = document.querySelector(".statisticsScreen");
const timeStat = document.querySelector(".totalTimeList");
const reactions = document.querySelector(".reactions");
statBtn.addEventListener("click",(evt)=>{
    evt.preventDefault();
    statScreen.style.opacity='100';
    document.querySelector('#leftcont').style.filter="blur(10px)";

    socket.emit("get statistics",roomid);
    
})

const statsCloseBtn=document.querySelector('#stat-close')                //configure and style button that closes editor
statsCloseBtn.innerHTML='<div class="nav-cancel is-active" id="nav-cancel"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg></div>'
statsCloseBtn.addEventListener("click",(evt)=>{
    document.querySelector('#leftcont').style.filter="";
    statScreen.style.opacity='0';
    
})

/*Get total speaking time for every user from server.
Also get most major emotions and their duration for every user in a room from server
For every user check if their name already appears on the panel and make new <li> with their stats if not
Extract the number of seconds from the <li> and update it to the new time/emotion value if the stat is already on the panel
 */

socket.on("get statistics",async (time,emotions)=>{
    const totalTime= await time;
    if (totalTime){
        totalTime.forEach((user)=>{
            const exists=document.querySelector(`#${user.username}`);
            if(exists){
                const seconds = exists.innerHTML.match(/\d+ seconds/g).join("");
                (seconds.match(/\d/g).join("")<user.total)?exists.innerHTML=`<span>${user.username}</span> --> ${user.total} seconds (${(user.total/60).toLocaleString('en-US',{maximumFractionDigits:2})} minutes)`:null;
            }else{
                const newListStat = document.createElement("li");
                newListStat.setAttribute("id",`${user.username}`);
                newListStat.innerHTML=`<span>${user.username}</span> --> ${user.total} seconds (${(user.total/60).toLocaleString('en-US',{maximumFractionDigits:2})} minutes)`;
                timeStat.appendChild(newListStat);
            }
        })
    }
    const emojis = await emotions;
    for(const user in emojis){
        if(!document.querySelector(`#${user}EM`)){
            const newH3 = document.createElement("h3");
            newH3.setAttribute("id",`${user}EM`);
            newH3.innerText=`${user}`
            reactions.appendChild(newH3);
        }
        for(const emotion of emojis[user]){
            const exists=document.querySelector(`#${user}${emotion.emotion}`);
            if(exists){
                const seconds = exists.innerHTML.match(/\d+ seconds/g).join("");
                (seconds.match(/\d/g).join("")<emotion.time/1000)?exists.innerHTML=`has been feeling <span>${emotion.emotion}</span> for a duration of <span>${(emotion.time/1000).toLocaleString('en-US',{maximumFractionDigits:2})} seconds </span> (${(emotion.time/(1000*60)).toLocaleString('en-US',{maximumFractionDigits:2})} minutes)`:null;
            }else{
                const newListStat = document.createElement("li");
                newListStat.setAttribute("id",`${user}${emotion.emotion}`);
                newListStat.innerHTML=`has been feeling <span>${emotion.emotion}</span> for a duration of <span>${(emotion.time/1000).toLocaleString('en-US',{maximumFractionDigits:2})} seconds </span> (${(emotion.time/(1000*60)).toLocaleString('en-US',{maximumFractionDigits:2})} minutes)`;
                reactions.appendChild(newListStat);
            }
        }
    }
    
})





