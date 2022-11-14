require("dotenv").config();
const fs = require("fs")
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;
const API_KEY_SID = process.env.TWILIO_API_KEY_SID
const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require("twilio")(accountSid, authToken);
const express = require("express");
const app = express();
const port = 5000;

app.use(express.json());

const twilioClient = require("twilio")(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

// const createComposition = async (roomSid)
// client.video.v1.recordings("RT04e49e6d379cffb556aecb01a4659850").fetch().then(recording => console.log(recording));
// client.video.v1.recordings.list({groupingSid: ["RMd51d7eca27084dd430afc78a1d4674e4"]}).then(recordings => recordings.forEach(r => console.log(r.sid)));
// client.video.v1.compositions.create({videoLayout: {transcode: {video_sources: "RT04e49e6d379cffb556aecb01a4659850"}},format: 'mp4', roomSid: "RMd51d7eca27084dd430afc78a1d4674e4"}).then(composition => console.log(composition.sid))
// client.video.v1.compositionSettings().fetch().then(composition_settings => console.log(composition_settings.friendlyName));
// client.video.v1.compositions.create({audioSources: ['*'], videoLayout: { grid : { video_sources : ['*']}} ,format: 'mp4', roomSid: 'RMd51d7eca27084dd430afc78a1d4674e4'}).then(composition => console.log(composition));
// client.video.v1.compositions.list({roomSid: "RMd51d7eca27084dd430afc78a1d4674e4"}).then(compositions => compositions.forEach(c => console.log("Composition SID : ", c.sid, ", With status : ", c.status, "Media link : ", c.links.media)));
// client.conversations.v1.conversations("CHb12e788d58b14e758e422bc62035fcbc").fetch().then(conversation => console.log(conversation));
// client.conversations.v1.conversations("CHb12e788d58b14e758e422bc62035fcbc").messages.create({author: "sal", body: "pls help me"}).then(message => console.log(message));
// client.conversations.v1.conversations("CHb12e788d58b14e758e422bc62035fcbc").messages.list({limit: 20}).then(message => message.forEach(m => console.log("List : ",m.index, "Body : ", m.body)));
// client.conversations.v1.conversations.create({friendlyName: "roomChat"}).then(message => console.log(message));
// client.conversations.v1.services("IS97b5fbdfa2904f3f8f364d67e714ceae").conversations("CHf301afe76b9f4b6eaf94e922a15ca69c").fetch().then(conversation => console.log(conversation));

const findOrCreateRoom = async (roomName) => {
    try {
        room = await twilioClient.video.rooms(roomName).fetch();
        console.log("Room : ", room);
    } catch (error) {
        if (error.code == 20404) {
            room = await twilioClient.video.rooms.create({
                uniqueName: roomName,
                type: "group",
                recordParticipantsOnConnect: true,
            });
            console.log("Room : ", room);
        } else {
            throw error;
        }
    } return room;
}

const findOrCreateConversation = async (roomName) => {
    try {
        conversation = await twilioClient.conversations.v1.conversations(roomName).fetch();
        console.log("Conversation : ", conversation);
        return conversation
    } catch (error) {
        conversation = await twilioClient.conversations.v1.conversations.create({
            friendlyName: roomName,
        });
        console.log("Conversation : ", conversation);
        return conversation
    }
}

const handleMessage = async (conversationSid, identity, bodymsg) => {
    try {
        message = await twilioClient.conversations.v1.conversations(conversationSid).
        messages.create({author: identity, body: bodymsg});
        client.conversations.v1.conversations("CHb12e788d58b14e758e422bc62035fcbc").
        messages.create({author: "sal", body: "pls help me"}).then(message => console.log(message));
    } catch (error) {
        console.log(error);
    }
}

const recordingRules = async (roomSid) => {
    recording = await twilioClient.video.rooms(roomSid)
    .recordingRules.update({rules: [{"type": "include", "all": "true"}]})
    console.log(recording);
    return recording;
}

const updateRules = async (roomSid) => {
    recording = await twilioClient.video.rooms(roomSid)
    .recordingRules.update({rules: [{"type": "exclude", "all": "true"}]})
    console.log(recording);
    return recording;
}

const getAccessToken = (roomName, userName, chat) => {
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,
        {   ttl : 14400,
            identity: userName}
    );
    token.addGrant(new VideoGrant({room: roomName}))
    token.addGrant(new ChatGrant({serviceSid: chat}))
    return token.toJwt();
}

// const compositionSid = "CJ1f776302b014fa96215b1f1ef50c46a1"
// const uri = "https://video.twilio.com/v1/Compositions/" + compositionSid + "/Media?Ttl=3600";
// client
//   .request({
//     method: "GET",
//     uri: uri,
//   })
//   .then((response) => {
//     // For example, download the media to a local file
//     const file = fs.createWriteStream("myFile.mp4");
//     const r = request(response.body.redirect_to);
//     r.on("response", (res) => {
//       res.pipe(file);
//     });
//   })
//   .catch((error) => {
//     console.log("Error fetching /Media resource " + error);
//   });

app.post("/join", async (req, res) => {
    if (!req.body.roomName) {
        return res.status(400).send("Must include roomName argument")
    } else if (!req.body.userName) {
        return res.status(400).send("Must include userName argument")
    } else if (!req.body) {
        return res.status(400).send("Must include roomName and userName argument")
    }
    const roomName = req.body.roomName;
    const userName = req.body.userName;
    const room = await findOrCreateRoom(roomName)
    const conversation = await findOrCreateConversation(roomName)
    const chat = conversation.chatServiceSid
    const sid = conversation.sid
    const roomSid = room.sid
    const token = getAccessToken(roomName,userName,chat);
    res.send({token: token, conversationSid : sid, sidRoom : roomSid})
})

app.post("/start", async (req, res) => {
    if (!req.body) {
        return res.status(400).send("Missing Room SID")
    }
    const roomSid = req.body.roomSid;
    const startRecording = await recordingRules(roomSid);
    res.send({rulesRecording : startRecording})
})

app.post("/stop", async (req, res) => {
    if (!req.body) {
        return res.status(400).send("Missing Room SID")
    }
    const roomSid = req.body.roomSid;
    const stopRecording = await updateRules(roomSid);
    res.send({rulesRecording : stopRecording})
})

app.post("/msg", async (req, res) => {
    if (!req.body) {
        return res.status(400).send("Need arguments")
    }
    const conversationSid = req.body.sid
    const identity = req.body.name
    const bodymsg = req.body.msg
    await handleMessage(conversationSid, identity, bodymsg)
    if (res.status(400)) {
        res.send("Unsuccessfull")
    } else {res.send("Success")}
})

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("public/index.html")
});

app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
});