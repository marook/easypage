const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Username: ', username => {
    rl.question('Password: ', password => {
        rl.close();
        const passwordHash =
              crypto.createHmac('sha512', username)
              .update(password)
              .digest('hex');
        console.log('Password hash:', passwordHash);
    });
});
