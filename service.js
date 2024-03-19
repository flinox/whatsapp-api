const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const speakeasy = require('speakeasy');

const { Client, LocalAuth } = require('whatsapp-web.js');
const app = express();
const fs = require('fs');

const CACHE_FOLDER_PATH = './.wwebjs_cache';

let client;

const inicializa = () => {

  client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox"],
    },
    authStrategy: new LocalAuth(),
  });


  fs.access(CACHE_FOLDER_PATH, fs.constants.F_OK, (err) => {
    if (err) {
      client.on('qr', qr => { qrcode.generate(qr, { small: true }); });
    }
  });

  
  client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
  });

  client.on('authenticated', () => {
      console.log('AUTHENTICATED');
  });

  client.on('ready', () => console.log('Tudo certo para enviar mensagens!'));    

  client.initialize();

}

inicializa();


app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

app.use(bodyParser.json());

app.post('/sendTOTP', sendText);

function sendText(req, res) {
  const { number } = req.body;
  const totpsecret = req.headers['totpsecret'];

  // Gere um token TOTP
  const token = speakeasy.totp({
      secret: totpsecret,
      encoding: 'base32'
  });

  const message = 'Seu código de acesso é ' + token;
  console.log('>>> Enviando mensagem: "'+ message +'" para o whatsapp ' + number);
  
  client.sendMessage(number+'@c.us', message);
  res.send({ status: 'Mensagem enviada para ' + number });
}

app.listen(3000, () => {
  console.log('Serviço está rodando na porta 3000');
});
