/**

    Copyright 2017 Amazon.com, Inc. and its affiliates. All Rights Reserved.
    Licensed under the Amazon Software License (the "License").
    You may not use this file except in compliance with the License.
    A copy of the License is located at
      http://aws.amazon.com/asl/
    or in the "license" file accompanying this file. This file is distributed
    on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
    or implied. See the License for the specific language governing
    permissions and limitations under the License.

    This skill demonstrates how to use Dialog Management to delegate slot
    elicitation to Alexa. For more information on Dialog Directives see the
    documentation: https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html

    This skill also uses entity resolution to define synonyms. Combined with
    dialog management, the skill can ask the user for clarification of a synonym
    is mapped to two slot values.
 **/


"use strict";
const Alexa = require("alexa-sdk");

// For detailed tutorial on how to make an Alexa skill,
// please visit us at http://alexa.design/build

let currentScriptName = "";
const WELCOME_STMT = "Welcome to Prescription Reminder. I will remind you when to take your prescriptions.";
const HELP_STMT = "This is Prescription Reminder. I can remind you when to take your presciptions. You can add prescirptions with multiple reminders. You can also list all your prescriptions and you can change or delete prescriptions.";
const MAIN_MENU_PROMPT = "Say one of the following: add prescription, list prescriptions, delete prescription, or change prescription.";
const ANOTHER_REMINDER_PROMPT = "Say either add a reminder or fimished with reminders."

let handlers = {
    "LaunchRequest": function () {
        console.log("in LaunchRequest");
        this.response.speak(WELCOME_STMT + " " + MAIN_MENU_PROMPT).listen(MAIN_MENU_PROMPT);
        this.emit(":responseReady");
    },
    "AddScriptIntent": function() {
        // delegate to Alexa to collect all the required slots
        let filledSlots = delegateSlotCollection.call(this);
        if (!filledSlots) {
            return;
        }

        console.log("filled slots: " + JSON.stringify(filledSlots));
        // at this point, we know that all required slots are filled.
        let slotValues = getSlotValues(filledSlots);

        console.log(JSON.stringify(slotValues));

        if (slotValues.scriptName && slotValues.scriptName.resolved) {
          currentScriptName = slotValues.scriptName.resolved;
        }

        let speechOutput = "Adding script " + slotValues.scriptName.resolved +
                ", script name " + currentScriptName +
                ". days of the week " + slotValues.scriptDow.resolved +
                ", reminder at " + slotValues.scriptTime.resolved +
                ". " + ANOTHER_REMINDER_PROMPT;

        console.log("Speech output: ", speechOutput);
        this.response.speak(speechOutput).listen(ANOTHER_REMINDER_PROMPT);
        this.emit(":responseReady");
    },
    "AnotherReminderIntent": function () {
      // delegate to Alexa to collect all the required slots
      let filledSlots = delegateSlotCollection.call(this);
      if (!filledSlots) {
          return;
      }

      console.log("filled slots: " + JSON.stringify(filledSlots));
      // at this point, we know that all required slots are filled.
      let slotValues = getSlotValues(filledSlots);

      console.log(JSON.stringify(slotValues));

      let speechOutput = "Adding reminder for script " + currentScriptName +
              ". days of the week " + slotValues.scriptDow.resolved +
              ", reminder at " + slotValues.scriptTime.resolved +
              ". "  + ANOTHER_REMINDER_PROMPT;

      console.log("Speech output: ", speechOutput);
      this.response.speak(speechOutput).listen(ANOTHER_REMINDER_PROMPT);
      this.emit(":responseReady");
    },
    "FinishedWithRemindersIntent": function() {
      this.response.speak(MAIN_MENU_PROMPT);
      this.emit(":responseReady");
    },
    "SessionEndedRequest": function () {
        console.log("Session ended with reason: " + this.event.request.reason);
    },
    "AMAZON.StopIntent": function () {
        this.response.speak("Bye");
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function () {
        this.response.speak(HELP_STMT + " " + MAIN_MENU_PROMPT).listen(MAIN_MENU_PROMPT);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak("Bye");
        this.response.shouldEndSession = true;
        this.emit(":responseReady");
    },
    "Unhandled": function () {
        this.response.speak("Sorry, I didn't get that. " + MAIN_MENU_PROMPT);
    }
};

exports.handler = function (event, context, callback) {

    // Each time your lambda function is triggered from your skill,
    // the event's JSON will be logged. Check Cloud Watch to see the event.
    // You can copy the log from Cloud Watch and use it for testing.
    console.log("====================");
    console.log("REQUEST: " + JSON.stringify(event));
    console.log("====================");
    let alexa = Alexa.handler(event, context);

    // Part 3: Task 4
    // alexa.dynamoDBTableName = 'petMatchTable';
    alexa.registerHandlers(handlers);
    alexa.execute();
};


const REQUIRED_SLOTS = [
    "preferredSpecies",
    "bloodTolerance",
    "personality",
    "salaryImportance"
];

const slotsToOptionsMap = {
    "unimportant-introvert-low-animals": 20,
    "unimportant-introvert-low-people": 8,
    "unimportant-introvert-high-animals": 1,
    "unimportant-introvert-high-people": 4,
    "unimportant-extrovert-low-animals": 10,
    "unimportant-extrovert-low-people": 3,
    "unimportant-extrovert-high-animals": 11,
    "unimportant-extrovert-high-people": 13,
    "somewhat-introvert-low-animals": 20,
    "somewhat-introvert-low-people": 6,
    "somewhat-introvert-high-animals": 19,
    "somewhat-introvert-high-people": 14,
    "somewhat-extrovert-low-animals": 2,
    "somewhat-extrovert-low-people": 12,
    "somewhat-extrovert-high-animals": 17,
    "somewhat-extrovert-high-people": 16,
    "very-introvert-low-animals": 9,
    "very-introvert-low-people": 15,
    "very-introvert-high-animals": 17,
    "very-introvert-high-people": 7,
    "very-extrovert-low-animals": 17,
    "very-extrovert-low-people": 0,
    "very-extrovert-high-animals": 1,
    "very-extrovert-high-people": 5
};

const options = [
    {"name": "Actor", "description": ""},
    {"name": "Animal Control Worker", "description": ""},
    {"name": "Animal Shelter Manager", "description": ""},
    {"name": "Artist", "description": ""},
    {"name": "Court Reporter", "description": ""},
    {"name": "Doctor", "description": ""},
    {"name": "Geoscientist", "description": ""},
    {"name": "Investment Banker", "description": ""},
    {"name": "Lighthouse Keeper", "description": ""},
    {"name": "Marine Ecologist", "description": ""},
    {"name": "Park Naturalist", "description": ""},
    {"name": "Pet Groomer", "description": ""},
    {"name": "Physical Therapist", "description": ""},
    {"name": "Security Guard", "description": ""},
    {"name": "Social Media Engineer", "description": ""},
    {"name": "Software Engineer", "description": ""},
    {"name": "Teacher", "description": ""},
    {"name": "Veterinary", "description": ""},
    {"name": "Veterinary Dentist", "description": ""},
    {"name": "Zookeeper", "description": ""},
    {"name": "Zoologist", "description": ""}
];

// ***********************************
// ** Helper functions from
// ** These should not need to be edited
// ** www.github.com/alexa/alexa-cookbook
// ***********************************

// ***********************************
// ** Dialog Management
// ***********************************

function getSlotValues(filledSlots) {
    //given event.request.intent.slots, a slots values object so you have
    //what synonym the person said - .synonym
    //what that resolved to - .resolved
    //and if it's a word that is in your slot values - .isValidated
    let slotValues = {};

    console.log("The filled slots: " + JSON.stringify(filledSlots));
    Object.keys(filledSlots).forEach(function (item) {

        // console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));

        let name = filledSlots[item].name;
        //console.log("name: "+name);

        if (filledSlots[item] &&
             filledSlots[item].resolutions &&
             filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
             filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
             filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {

            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            case "ER_SUCCESS_MATCH":
                slotValues[name] = {
                    "synonym": filledSlots[item].value,
                    "resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                    "isValidated": true
                };
                break;
            case "ER_SUCCESS_NO_MATCH":
                slotValues[name] = {
                    "synonym": filledSlots[item].value,
                    "resolved": filledSlots[item].value,
                    "isValidated":false
                };
                break;
            }
        } else {
            slotValues[name] = {
                "synonym": filledSlots[item].value,
                "resolved": filledSlots[item].value,
                "isValidated": false
            };
        }
    },this);

    //console.log("slot values: "+JSON.stringify(slotValues));
    return slotValues;
}

// This function delegates multi-turn dialogs to Alexa.
// For more information about dialog directives see the link below.
// https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html
function delegateSlotCollection() {
    console.log("in delegateSlotCollection");
    console.log(" dialogState: " + this.event.request.dialogState);

    if (this.event.request.dialogState === "STARTED") {
        console.log("in STARTED");
        console.log(JSON.stringify(this.event));
        let updatedIntent = this.event.request.intent;
        // optionally pre-fill slots: update the intent object with slot values
        // for which you have defaults, then return Dialog.Delegate with this
        // updated intent in the updatedIntent property

        disambiguateSlot.call(this);
        console.log("disambiguated: " + JSON.stringify(this.event));
        this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("in not completed");
        let updatedIntent = this.event.request.intent;
        //console.log(JSON.stringify(this.event));

        disambiguateSlot.call(this);
        this.emit(":delegate", updatedIntent);
    } else {
        console.log("in completed");
        //console.log("returning: "+ JSON.stringify(this.event.request.intent));
        // Dialog is now complete and all required slots should be filled,
        // so call your normal intent handler.
        return this.event.request.intent.slots;
    }
    return null;
}

// If the user said a synonym that maps to more than one value, we need to ask
// the user for clarification. Disambiguate slot will loop through all slots and
// elicit confirmation for the first slot it sees that resolves to more than
// one value.
function disambiguateSlot() {
    let currentIntent = this.event.request.intent;
    let prompt = "";
    Object.keys(this.event.request.intent.slots).forEach(function (slotName) {
        let currentSlot = currentIntent.slots[slotName];
        // let slotValue = slotHasValue(this.event.request, currentSlot.name);
        if (currentSlot.confirmationStatus !== "CONFIRMED" &&
            currentSlot.resolutions &&
            currentSlot.resolutions.resolutionsPerAuthority[0]) {

            if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_MATCH") {
                // if there's more than one value that means we have a synonym that
                // mapped to more than one value. So we need to ask the user for
                // clarification. For example if the user said "mini dog", and
                // "mini" is a synonym for both "small" and "tiny" then ask "Did you
                // want a small or tiny dog?" to get the user to tell you
                // specifically what type mini dog (small mini or tiny mini).
                if (currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
                    prompt = "Which would you like";
                    let size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;
                    currentSlot.resolutions.resolutionsPerAuthority[0].values.forEach(function (element, index, arr) {
                        prompt += ` ${(index === size - 1) ? " or" : " "} ${element.value.name}`;
                    });

                    prompt += "?";
                    let reprompt = prompt;
                    // In this case we need to disambiguate the value that they
                    // provided to us because it resolved to more than one thing so
                    // we build up our prompts and then emit elicitSlot.
                    this.emit(":elicitSlot", currentSlot.name, prompt, reprompt);
                }
            } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code === "ER_SUCCESS_NO_MATCH") {
                // Here is where you'll want to add instrumentation to your code
                // so you can capture synonyms that you haven't defined.
                console.log("NO MATCH FOR: ", currentSlot.name, " value: ", currentSlot.value);

                if (REQUIRED_SLOTS.indexOf(currentSlot.name) > -1) {
                    prompt = "What " + currentSlot.name + " are you looking for";
                    this.emit(":elicitSlot", currentSlot.name, prompt, prompt);
                }
            }
        }
    }, this);
}

// Given the request an slot name, slotHasValue returns the slot value if one
// was given for `slotName`. Otherwise returns false.
function slotHasValue(request, slotName) {

    let slot = request.intent.slots[slotName];

    // uncomment if you want to see the request
    // console.log("request = "+JSON.stringify(request));
    let slotValue;

    // if we have a slot, get the text and store it into speechOutput
    if (slot && slot.value) {
        // we have a value in the slot
        slotValue = slot.value.toLowerCase();
        return slotValue;
    } else {
        // we didn't get a value in the slot.
        return false;
    }
}
