import FireBase from 'firebase-admin';

const serviceAccount = require('../../firebase-cred');

FireBase.initializeApp({
    credential: FireBase.credential.cert(serviceAccount),
    databaseURL: 'https://arc-push.firebaseio.com/',
});

console.log(FireBase.database());