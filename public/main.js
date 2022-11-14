const form = document.getElementById('join-room-form');
const usernameInput = document.getElementById('username');
const roomnameInput = document.getElementById('roomname');
const button = document.getElementById('join_leave');
const recordingbtn = document.getElementById("recording_btn")
const toggleChat = document.getElementById('toggle_chat');
const container = document.getElementById('container');
const count = document.getElementById('count');
const chatScroll = document.getElementById('chat-scroll');
const chatContent = document.getElementById('chat-content');
const chatInput = document.getElementById('chat-input');
const compbtn = document.getElementById("compositions");
var isRecording = []
let connected = false;
let recording;
let recordingData;
let room;
let chat;
let conv;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementById('local').firstChild;
        let trackElement = track.attach();
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
        video.append(trackElement);
    });
};

const startRoom = async (event) => {
    event.preventDefault();
    button.innerHTML = "Disconnect"
    recordingbtn.disabled = false
    toggleChat.disabled = false;
    const nameUser = usernameInput.value;
    const nameRoom = roomnameInput.value;
    console.log("userName : ",nameUser);
    console.log("roomName : ", nameRoom);
    let data;
    const response = await fetch("/join", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName: nameRoom, userName: nameUser }),
    }).then(res => res.json()).then(_data => {
        data = _data;
        return Twilio.Video.connect(data.token);
    })
    .then(_room => {
        room = _room;
        checkConversation(data.token, data.conversationSid)
    })
    .then(_recording => {
        recording = _recording;
        isRecording.push(data.sidRoom)
        console.log("Room SID : ",isRecording[0]);
    })
}

const startRecording = async (event) => {
    event.preventDefault();
    if (recordingbtn.value == "start") {
        recordingbtn.disabled = false
        recordingbtn.value = "stop"
        recordingbtn.innerHTML = "Stop recording"
        const response = await fetch("/start", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ roomSid: isRecording[0] }), 
        }).then(res => res.json()).then(_recordingData => {
            recordingData = _recordingData
            console.log(recordingData);
        })
    } else {
        recordingbtn.disabled = false
        recordingbtn.value = "start"
        recordingbtn.innerHTML = "Start recording"
        const response = await fetch("/stop", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ roomSid: isRecording[0] }), 
        }).then(res => res.json()).then(_recordingData => {
            recordingData = _recordingData
            console.log(recordingData);
        })
    }
}

function toogleChatHandler() {
    if (root.classList.contains('withChat')){
        root.classList.remove('withChat');
    }
    else {
        root.classList.add('withChat');
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
}

function onChatInputKey(ev) {
    if (ev.keyCode == 13) {
        conv.sendMessage(chatInput.value);
        chatInput.value = '';
    }
};

function connectChat(token, conversationSid) {
    return Twilio.Conversations.Client.create(token).then(_chat => {
        chat = _chat;
        return chat.getConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            conv.on('messageAdded', (message) => {
                addMessageToChat(message.author, message.body);
            });
            return conv.getMessages().then((messages) => {
                chatContent.innerHTML = '';
                for (let i = 0; i < messages.items.length; i++) {
                    addMessageToChat(messages.items[i].author, messages.items[i].body);
                }
                toggleChat.disabled = false;
            });
        });
    }).catch(e => {
        console.log(e);
    });
};

function checkConversation(token, conversationSid) {
    return Twilio.Conversations.Client.create(token).then(_chat => {
        chat = _chat
        console.log("Chat checker isConnected : ", chat);
        return chat.peekConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            console.log("Conversation checker isConnected : ", conv);
        })
    })
}

function addMessageToChat(user, message) {
    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

// function checkCompositions = async(composition) => {
//     const compositionSid = "CJ147973685508824776b3a08499146358"
//     const uri = "https://video.twilio.com/v1/Compositions/" + compositionSid + "/Media?Ttl=3600";
//     const request = await fetch(`${uri}`, {
//         method: "GET"
//     }).then((response) => {
//         const file = fs.createWriteStream("myFile.mp4");
//         const r = request(response.body.redirect_to);
//         r.on("response", (res) => {
//             res.pipe(file)
//         });
//     }).catch((error) => {
//         console.log("Error fetching /Media resource " + error);
//     })
// }

// const checkCompositions = async(event) => {
//     event.preventDefault();
//     const compositionSid = "CJ147973685508824776b3a08499146358"
//     const uri = "https://video.twilio.com/v1/Compositions/" + compositionSid + "/Media?Ttl=3600";
//     const request = await fetch(`${uri}`, {
//         method: "GET"
//     }).then((response) => {
//         const file = fs.createWriteStream("myFile.mp4");
//         const r = request(response.body.redirect_to);
//         r.on("response", (res) => {
//             res.pipe(file)
//         });
//     }).catch((error) => {
//         console.log("Error fetching /Media resource " + error);
//     })
// }

addLocalVideo();
form.addEventListener("submit", startRoom);
toggleChat.addEventListener("click", toogleChatHandler);
recordingbtn.addEventListener("click", startRecording);
chatInput.addEventListener('keyup', onChatInputKey);
// compbtn.addEventListener("click", checkCompositions);