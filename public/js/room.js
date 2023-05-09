import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.5.53/+esm'
import {QuillBinding} from 'https://cdn.jsdelivr.net/npm/y-quill@0.1.5/+esm'
import {SocketIOProvider} from 'https://cdn.jsdelivr.net/npm/y-socket.io@1.1.0/+esm'
import QuillCursors from 'https://cdn.jsdelivr.net/npm/quill-cursors@4.0.2/+esm'

const socket = io();
const myvideo = document.querySelector("#vd1");
const roomid = params.get("room");
let username;
let sd = 1;

let emoOn=false;

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


//create yjs document and connect it with the socket
function loadDoc(){                 
    const doc = new Y.Doc()
    const provider= new SocketIOProvider('https://localhost:3000',roomid,doc,{
        // disableBc: true,
        // auth: { token: 'valid-token' },
      })
      
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
			document.getElementById('raiseHand').style.display = "block";
			rname = username;
			socket.emit('action', 'raiseHand');
			
	}
	else 
	{
       	document.getElementById('raiseHand').style.display = "none";
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


function handleVideoOffer(offer, sid, cname, micinf, vidinf, raiseinf, nodispinf) {

    sd += 1 ;
	cName[sid] = cname;
	
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
            emo.innerHTML = ` <img id=\"emo${sid}\" src=\"neutral.png\" width=\"50px\" height=\"50px\">`;
			raiseh.innerHTML = " <img src=\"raisedhand.png\" width=\"50px\" height=\"50px\">";
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


socket.on('join room', async (conc, cnames, micinfo, videoinfo, raiseinfo, nodispinfo,docInfo) => {
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
		
	 	

    //if room was just created or new user enters, create or load text editor and provider and set cursors
    if(docInfo==undefined){
        const {type,provider,doc}=loadDoc()
        loadQuill()
        setMultipleCursors()
        provider.awareness.setLocalStateField('user',{              //username and color appears on user cursor
            name:username,
            color:getCursorColor(0)
        })
        const binding= new QuillBinding(type,editor,provider.awareness)
        docs[roomid]={doc,provider,type,binding}                    //store document info
        socket.emit('store-doc',{doc,type,provider:provider.awareness,roomid})
    }else{
        const {doc,type,provider}=docInfo
        loadQuill()
        setMultipleCursors(editor)
        provider.setLocalStateField('user',{              //username and color appears on user cursor
            name:username,
            color:getCursorColor(0)
        })
        const binding= new QuillBinding(type,editor,provider)

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
					emo.innerHTML = ` <img id="emo${sid}" src=\"neutral.png\" width=\"50px\" height=\"50px\">`;
					raiseh.innerHTML = " <img src=\"raisedhand.png\" width=\"50px\" height=\"50px\">";
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
        docs[roomid].provider.disconnect()
    }
})

//when user clicks editor button make it hidden or visible
//also connect or disconnect the document socket provider accordingly
textIcon.addEventListener('click', () => {
    if (editorVisible) {
        hideUserCursors()
        textEditor.style.visibility = 'hidden';
        editorVisible = false;
        docs[roomid].provider.disconnect()
    }
    else {
        whiteboardCont.style.visibility = 'hidden';
        textEditor.style.visibility = 'visible';
        editorVisible = true;
        boardVisisble = false;
        docs[roomid].provider.connect()
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
            
            clearInterval(intervalID);
            intervalID=null;

            setTimeout(()=>{
                for(sid in connections){
                    document.getElementById(`emo${sid}`).src="neutral.png";
                    console.log("neutralizing");
                }
                document.getElementById(`iml`).src="neutral.png";
                console.log("neutralized local");

            },1000)
            
        
           
            emojiSID=[];
        }  
        //Emoji tracking is turned on 
        else{
            emoOn=true;
            console.log("emoON")
            turnOnEmojis();

            
        } 
    })
    
}
}
emojiSID=[];


  


function turnOnEmojis(){

    let video="";
    let sids="";
    let ctr=0;
    //For every connected user we track his video and output the according emoji to his icon
    for(sid in connections){
    console.log("Ctr ",++ctr);
    if(!emojiSID.includes(sid)){
    emojiSID.push(sid);
    video=document.getElementById(`video${sid}`);
    
    console.log("sid",sid,"  video",video);
    if(!intervalID){
        intervalID=setInterval(async () => 
        {
        if(emoOn){
            
        for(sid in connections){
            video=document.getElementById(`video${sid}`);
            emoRem=document.getElementById(`emo${sid}`);

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
                                case '3': source="img/smile.png";
                                break;
                                case '4': source="img/sad.png";
                                break;
                                case '5': source="img/angry.png";
                                break;
                                case '6': source="img/scared.png";
                                break;
                                case '7': source="img/disgust.png";
                                break;
                                case '8': source="img/surprised.png";
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
                                case '3': source="img/smile.png";
                                break;
                                case '4': source="img/sad.png";
                                break;
                                case '5': source="img/angry.png";
                                break;
                                case '6': source="img/scared.png";
                                break;
                                case '7': source="img/disgust.png";
                                break;
                                case '8': source="img/surprised.png";
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
                
            console.log("detection \n");   
        }
        //code for the case that the interval hasnt yet shut down after emoji display is toggled off
        else
        {
            for(sid in connections){
                document.getElementById(`emo${sid}`).src="neutral.png";
                console.log("neutralizing");
            }
            document.getElementById(`iml`).src="neutral.png";
            console.log("neutralized local");
        } 
            }, 150);
        }
        
        }
    	
    }

    console.log("length ",emojiSID.length);
        
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


