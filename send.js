const amqp = require('amqplib/callback_api');

const RABBITMQ_URL = 'amqp://da128f28645bed7959370cd787bacaea0a0805b865f384f3eb13d14f197aefea:10d44afbb704348fe098e68ea5c96a6878ffa336a853168fbee1d9d03c7ce4e5@127.0.0.1:5672/klinik_lidwina_charitas_vhost'; // Change if needed
const QUEUE_NAME = 'messages';

const sendMessage = (message) => {
    amqp.connect(RABBITMQ_URL, (error, connection) => {
        if (error) {
            throw error;
        }

        connection.createChannel((error, channel) => {
            if (error) {
                throw error;
            }

            channel.assertQueue(QUEUE_NAME, {
                durable: false
            });

            channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
            console.log(`Sent: ${message}`);
        });

        setTimeout(() => {
            connection.close();
        }, 500);
    });
};

// Example usage

var json = {
    message: "aku sayang kamu banyak selalu love you more ❤️❤️❤️❤️❤️ muah http://stepanusjanu19.github.io/love.html 🩷🩷🩷🩷",
}

sendMessage(JSON.stringify(json));