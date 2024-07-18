// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const amqp = require('amqplib/callback_api');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// const RABBITMQ_URL = 'amqp://da128f28645bed7959370cd787bacaea0a0805b865f384f3eb13d14f197aefea:10d44afbb704348fe098e68ea5c96a6878ffa336a853168fbee1d9d03c7ce4e5@127.0.0.1:5672/klinik_lidwina_charitas_vhost';
// const QUEUE_NAME = 'messages';

// // Serve static HTML
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

// // Socket.IO connection
// io.on('connection', (socket) => {
//     console.log('A user connected');

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

// // Function to consume messages from RabbitMQ
// function consumeMessages() {
//     amqp.connect(RABBITMQ_URL, (error, connection) => {
//         if (error) throw error;

//         connection.createChannel((error, channel) => {
//             if (error) throw error;

//             channel.assertQueue(QUEUE_NAME, { durable: false });

//             console.log(`Waiting for messages in ${QUEUE_NAME}.`);

//             channel.consume(QUEUE_NAME, (msg) => {
//                 const message = msg.content.toString();
//                 console.log(`Received: ${message}`);
//                 io.emit('message', message); // Emit the message to all connected clients
//             }, { noAck: true });
//         });
//     });
// }

// // Send messages periodically for testing
// setInterval(() => {
//     amqp.connect(RABBITMQ_URL, (error, connection) => {
//         if (error) throw error;

//         connection.createChannel((error, channel) => {
//             if (error) throw error;

//             channel.assertQueue(QUEUE_NAME, { durable: false });
//             const message = `Hello at ${new Date().toLocaleTimeString()}`;
//             channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
//             console.log(`Sent: ${message}`);
//         });

//         setTimeout(() => {
//             connection.close();
//         }, 500);
//     });
// }, 5000); // Send a message every 5 seconds

// consumeMessages();

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require("nodemailer");
// const { google } = require("googleapis");
const amqp = require('amqplib/callback_api');

require('dotenv').config()
const ALLOW_URL = process.env.ALLOW_URL.split(',');
const RABBITMQ_URL = atob(process.env.RABBITMQ_URL); // Change if needed
const QUEUE_NAME = 'messages';

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors : {
        origin: decodeURI(atob(ALLOW_URL)),
        allowHeaders: ["1297398129ehiqhjdhsyd81y87d1"],
        credentials: true
    },
    allowRequest: (req, callback) => {
        const nonoriginheader = req.headers.origin === undefined;
        callback(null, nonoriginheader);
    }
});




// const oauth2 = google.auth.OAuth2;

// const clientOauth2 = new oauth2(
//     "746629671589-c6ululnqovrfhe7etg8958eq0s00r2bd.apps.googleusercontent.com",
//     "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",
//     "https://developers.google.com/oauthplayground"
// );

// clientOauth2.setCredentials({
//     refresh_token: ""
// });

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Function to consume messages from RabbitMQ
function consumeMessages() {
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

            console.log(`Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

            channel.consume(QUEUE_NAME, async (msg) => {
                const message = await msg.content.toString();
                const parsejson = await JSON.parse(message);

                console.log(`Received: ${message}`);

                try {

                    // const accesstoken = await clientOauth2.getAccessToken();

                    const send = nodemailer.createTransport({
                        service: 'Gmail',
                        // auth: {
                        //     type: 'OAuth2',
                        //     user: '01yoshyosh01@gmail.com',
                        //     clientId: "746629671589-c6ululnqovrfhe7etg8958eq0s00r2bd.apps.googleusercontent.com",
                        //     clientSecret: "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",
                        //     refreshToken: "",
                        //     accessToken: accesstoken.token
                        // },
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        },
                    });

                    const mailoptions = {
                        from: process.env.EMAIL_USER,
                        to: process.env.TARGET_MAIL,
                        subject: "test aja",
                        text: parsejson.message,
                        html: `<h1>${parsejson.message}</h1>`
                    };

                    const result = await send.sendMail(mailoptions);
                    var acceptname = result.accepted[0];

                    console.log(`Email sent ..... ${acceptname}`);
                    io.emit('message', `Email sent ..... to ${acceptname}`); // Emit the message to all connected Socket.IO clients
                } catch (error) {
                    console.error(`Error sending mail ..... ${error}`);
                    io.emit('message', `Error sending mail ..... ${error}`); // Emit the message to all connected Socket.IO clients
                }


            }, {
                noAck: true
            });
        });
    });
}

consumeMessages();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});