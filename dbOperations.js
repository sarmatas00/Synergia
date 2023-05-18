
//get database configuration
const operator=require('firebase/database');
const db=require('./config.js');

/*
  stores a message in a specific chat room.
  message is stored using as the key the createdAt timestamp
 */
function storeMessage(msg,room){
    operator.set(
        operator.ref(db,`messages/mainChat/${room}/${msg.createdAt}/`),
        msg    
    ); 
}

/*this method takes 2 references and gets called when a chat room is abandoned 
It removes all the messages from that chatroom and pushes them to the archive section of messages table
*/
function archiveChatroom(room){
    const dbref = operator.ref(db);
    const newRef = operator.ref(db,`messages/mainChat/archives/`);
    operator.get(operator.child(dbref,`messages/mainChat/${room}`)).then((messages)=>{
        if(messages.exists()){
            // console.log(messages);
            operator.push(newRef,messages.val())
            operator.remove(operator.ref(db,`messages/mainChat/${room}`));
        }
    })
    
}

/*this method finds all the messages that have been stored for a particular room
returns them to the server for displaying*/
async function getMessages(room){
    const dbRef = operator.ref(db);
    let messages={};
    messages = await operator.get(operator.child(dbRef,`messages/mainChat/${room}`))
    if(messages.exists()){
        return messages.val();
    }
    return null;
    
}

function saveEmojis(room,detection){
   console.log("doing db things");
   
    for(sid in detection){
        for(emotion in detection[sid]){
            operator.set(operator.ref(db,`emojis/${room}/${sid}/${emotion}`),detection[sid][emotion]);
        }
    }
}


module.exports = {storeMessage,archiveChatroom,getMessages,saveEmojis}