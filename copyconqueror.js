const clipboardListener = require('clipboard-event');
const ncp = require('copy-paste');
const notifier = require('node-notifier');
const axios = require('axios');
const SendEngine = require('./textengine.js');
const RecieveEngine = require('./responsengine.js');
const fs = require('fs');
let botresponse = false
const path = require("path");

//setup all settings//
const openAIkey = {};
const endPointConfig = {};
const instructions  ={};
const params = {}
const identities = {};
const formats = {};
const format = {};
const {setup} = require('./setup.js');
setup(openAIkey, endPointConfig, instructions, params,identities, formats, format, fs);
//end settings//
const recieveEngine = new RecieveEngine();
function testing(){//hooked into changehandler, copy to execute
    
}
var client =  {};
var lastClip = "";
var lastResponse = "";
const KoboldClient = require('./koboldinterface.js');
//if (configs.client== "kobold")
{
    client = new KoboldClient( axios, recieveApiResponse, returnSummary, NotificationBell, endPointConfig.routes.kobold );//todo, this doesnt really belong like this, should be created directly into textengine constructor and eliminate all this mess running across the main program. Needed before adding openAI, untangling this will make that much easier. 
    
} 
client.setPromptFormat(format.format);
const sendEngine = new SendEngine(client, ncp.copy, recieveApiResponse, NotificationBell, endPointConfig.routes, identities.identities, instructions.instructions,params.params, openAIkey.key, formats.formats);
function notify(title = "Paste Ready", text = "The response is ready."){
// Define the notification
const notification = {
    title: title,
    message: text,
    icon: './icon.jpg', // Optional
    sound: true, // Optional, plays a sound with the notification
    //I have a hypothesis that on linux we need to specify a sound file.
};
// Display the notification
notifier.notify(notification, function (err, response) {

  // Handle errors or response if needed
  //console.log(response);
});
}
function returnSummary(text){
    text = text.replace(/\\n/g, '\n');
    let Response = recieveEngine.recieveMessageFindTerminatorsAndTrim(text);
    sendEngine.recievesummary(Response);
    //client.getstats(sendData, "summary");
}
function recieveProcessedClip(identity, query, params) {
    client.formatQueryAndSend(identity, query, params);
}
function recieveApiResponse(text){
    text = text.replace(/\\n/g, '\n');
    NotificationBell("Paste Response:", text);
    botresponse = true
    lastResponse = recieveEngine.recieveMessageFindTerminatorsAndTrim(text);//I don't think this ever activates but it will support function calling maybe.
    lastClip = "";
    ncp.copy(lastResponse);
    //client.getTokenCount(lastResponse, agent, sendData);
}
// To start listening
function sendData(data, destination) {
    const flags = ['summary', 'user']; // Define your list of available destinations here
    //console.log(JSON.stringify(data));
    try {
        switch (destination) {
            case flags[0]:
                console.log(`Sending data to summary`);
                break;
            case flags[1]:
                console.log(`Sending data to ai memory`);
                break;
            default:
                //return to agent memory
                //throw new Error('Invalid destination');
                break;
        }

        // Send data to the chosen destination
        console.log(`Sent ${data} to ${destination}`);
    } catch (error) {
        console.error(`Error sending data: ${error.message}`);
    }
}


clipboardListener.on('change', () => {
    ncp.paste(clipboardChangeHandler)
    //console.log('Clipboard changed');
});
function clipboardChangeHandler(err,text, debug = true){
    //console.log(JSON.stringify(text));
    console.log("ClipboardChangeHandler: " +text);
    if (err) {
        NotificationBell("error: ", err+text); 
        return console.log(err+text);
    }
    let out = text.trim();
    if (lastClip !== out && lastResponse !== out&& !botresponse) {
        sendEngine.setupforAi(out);
        lastClip = out;
        //console.log(JSON.stringify(out));//|||coder|
        if(debug){
            //NotificationBell("text copied", lastClip);
            testing();
        }
    }

    botresponse = false;
}
//sounds spooky
function NotificationBell(title, text) {
            notify(title, text);        
}

clipboardListener.startListening();
{//cleanup listener
    process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Cleaning up and exiting...');
    // Perform any cleanup or dismounting necessary for your event handler here
    clipboardListener.stopListening(); // Remove all event listeners to prevent memory leaks
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Cleaning up and exiting...');
    // Perform any cleanup or dismounting necessary for your event handler here
    clipboardListener.stopListening(); // Remove all event listeners to prevent memory leaks
    process.exit(0);
  });
}

