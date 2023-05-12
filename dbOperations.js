
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
/*
  stores a group message in a specific chat room and group.
  message is stored using as the key the createdAt timestamp
 */
async function storeGroupMessage(msg,room,group){
    const dref=operator.ref(db,`messages/groupChat/${room}/${group}/messages/${msg.createdAt}`);
    operator.set(dref,msg);  
}


/*this method takes 2 references and gets called when a chat room is abandoned 
It removes all the messages from that chatroom and pushes them to the archive section of messages table
*/
function archiveChatroom(room){
    const dbref = operator.ref(db);
    const newRef = operator.ref(db,`messages/mainChat/archives/`);
    try {
        operator.get(operator.child(dbref,`messages/mainChat/${room}`)).then((messages)=>{
            if(messages.exists()){
                
                operator.push(newRef,messages.val())
                operator.remove(operator.ref(db,`messages/mainChat/${room}`));
            }
        })
    } catch (error) {
        console.log(error);
    }
    
}

/*this method takes 2 references and gets called when a group chat room is abandoned or deleted by its creator
It removes all the messages from that chatroom and pushes them to the archive section of group messages 
*/
function archiveGroupChatroom(room,group){
    const dbref = operator.ref(db);
    const newRef = operator.ref(db,`messages/groupChat/archives/`);
    try {
        operator.get(operator.child(dbref,`messages/groupChat/${room}/${group}/messages`)).then((messages)=>{
            if(messages.exists()){
                
                operator.push(newRef,messages.val())
                operator.remove(operator.ref(db,`messages/groupChat/${room}/${group}`));
            }
        })
    } catch (error) {
        console.log(error);
    }
    
}

/*this method finds all the messages that have been stored for a particular room
returns them to the server for displaying*/
async function getMessages(room){
    const dbRef = operator.ref(db);
    let messages={};
    try {
        messages = await operator.get(operator.child(dbRef,`messages/mainChat/${room}`))
        if(messages.exists()){
            return messages.val();
        }
    } catch (error) {
        console.log(error);
    }
    return null;
    
}

/*this method finds all the group messages that have been stored for a particular room and group
returns them to the server for displaying*/
async function getGroupMessages(room,group){
    const dbRef = operator.ref(db);
    let messages={};
    try {
        messages = await operator.get(operator.child(dbRef,`messages/groupChat/${room}/${group}/messages`))
        if(messages.exists()){
            return messages.val();
        }
    } catch (error) {
        console.log(error);
    }
    return null;
    
}

/*this method stores the total speaking time for a user in a room
 */
function storeSpeakingTime(room,username,time){
    const dref=operator.ref(db,`speakingTime/${room}/${username}/`);
    operator.set(dref,{time});  
}

/*this method updates the total speaking time for a user in a room
it is called every 10 minutes to update the time
 */
async function updateSpeakingTime(room,username,time){
    const oldTime=await getSpeakingTime(room,username);
    if(oldTime){
        const dref=operator.ref(db,`speakingTime/${room}/${username}/`);
        operator.update(dref,{time:time+parseInt(oldTime.time)});  
    }
}
/*this method finds the total speaking time for a user in a room
and returns it
 */
async function getSpeakingTime(room,username){
    const dbRef = operator.ref(db);
    try {
        const time = await operator.get(operator.child(dbRef,`speakingTime/${room}/${username}/`))
        if(time.exists()){
            return time.val();
        }
    } catch (error) {
        console.log(error);
    }
    return null;
}





module.exports = {getSpeakingTime,storeSpeakingTime,updateSpeakingTime,storeMessage,storeGroupMessage,archiveChatroom,getMessages,getGroupMessages,archiveGroupChatroom}