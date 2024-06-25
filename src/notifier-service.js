'use strict';

const TelegramBot = require('node-telegram-bot-api');

const Utils = require('./utils.js');

//----------------------

const TELEGRAM_MESSAGE_BYTES_LIMIT = 4096;

class NotifierService {
    constructor() {
        this.telegramBot = new TelegramBot(config.telegram.token);
        this.chatId = config.telegram.chatId;
    }

    notify(message) {
        let promise = Promise.resolve();
        this.splitMessage(message).forEach(message => {
            promise = promise.then(() => {
                return this.telegramBot.sendMessage(this.chatId, message, {parse_mode: 'HTML'}).catch(e => {
                    console.error("Error while notifying to telegram.. ", e);
                });
            }).then(Utils.delay(200));
        });
        return promise;
    }

    // Splits the message into multiple messages so that it fits telegram's max byte limit.
    splitMessage(message) {
        if (message.length <= TELEGRAM_MESSAGE_BYTES_LIMIT) {
            return [message];
        }

        let splitIndex = message.lastIndexOf('\n', TELEGRAM_MESSAGE_BYTES_LIMIT);
        console.log(`Splitting message of length ${message.length} at index ${splitIndex}`);

        let firstMessage = message.substring(0, splitIndex); // Not including the \n as it will be split into two messages
        let secondMessage = message.substring(splitIndex + 1);

        return [
            firstMessage,
            ...this.splitMessage(secondMessage),
        ];
    }
}

module.exports = NotifierService;
