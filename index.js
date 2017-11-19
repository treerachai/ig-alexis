const Nightmare = require('nightmare');
const prompt = require('prompt');
const fs = require('fs');
const instagram = require('./instagram');

const nightmare = Nightmare({ show: false, waitTimeout: 7000 });

let login = function () {
  prompt.get([{
    name: 'username',
    required: true,
  },{
    name: 'password',
    description: 'Password',
    type: 'string',
    hidden: true,
    replace: '*',
    required: true,
  }], function (err, result) {
    nightmare
    .goto('https://www.instagram.com/accounts/login/')
    .on('did-get-response-details',
      (
      sender,
      status,
      newURL,
      originalURL,
      httpResponseCode,
      requestMethod,
      referrer,
      headers,
      resourceType
      ) => {
          if(headers['set-cookie']) {
            if(headers['set-cookie'][4]) {
              let sessionID = headers['set-cookie'][4].slice(10);
              let csrftoken = headers['set-cookie'][1].match(/en=.*?;/g)[0].slice(3,-1);;
              nightmare.end();
              $data = JSON.stringify({
                sessionID,
                csrftoken
              });
              fs.writeFile(require('path').resolve(__dirname) + '/users.json', $data, (err) => {
                if (err) throw err;
              });
            }
          }
      })
    .type('input[name=username]',result.username)
    .type('input[name=password]',result.password)
    .click('button')
    .wait('.coreSpriteDesktopNavProfile')
    .evaluate(() => {
      return document.querySelector('.coreSpriteDesktopNavProfile').href;
    })
    .end()
    .then((link) => {
      let message = `Your IG link ${link}\nYour Session saved on location ./users.json`;
      console.log(message);
    })
    .catch((error) => {
      console.log('wrong username / password');
    });
  });
}

function logout() {
  fs.writeFile(require('path').resolve(__dirname) + '/users.json', '', (err) => {
    if (err) throw err;
  });
}

module.exports = (arg)  => {
  switch (arg._[0]) {
    case 'login':
      login()
      break;
    case 'logout':
      logout();
      break;
    default:
        instagram.exec(arg)
      break;
  }
}
