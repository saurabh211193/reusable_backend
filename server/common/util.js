import config from 'config';
import crypto from 'crypto';
import * as Path from 'path';
import _ from 'lodash';


const encryption = config.get('encryption');
const saltLength = 9;

/**
 *
 *
 * @param {any} len
 * @returns
 */
const generateSalt = len => {
    const set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    let salt = '';
    let p = 2;
    for (let i = 0; i < len; i++) {
        salt += set[p];
        p += 3;
    }
    return salt;
};


/**
 *
 *
 * @param {any} string
 * @returns
 */
const md5 = string => crypto.createHash('md5').update(string).digest('hex');


/**
 * @param  {} text
 */
const encryptString = text => {
    const cipher = crypto.createCipher(encryption.algorithm, encryption.password);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};


/**
 *
 *
 * @param {any} text
 * @returns
 */
const decryptString = function decrypt(text) {
    const decipher = crypto.createDecipher(encryption.algorithm, encryption.password);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};

/**
 * @param  {} text
 */
const encryptPass = text => {
    const salt = generateSalt(saltLength);
    const hash = md5(text + salt);
    return salt + hash;
};


/**
 *
 *
 * @returns
 */
const generateOtp = () => Math.floor(Math.random() * ((9999 - 1000) + 1)) + 1000;

const getRootDir = () => Path.normalize(`${__dirname}/../..`);

const createLoginResponse = (userInfo, socialData) => {
    const {
        googleInfo,
        fbInfo,
        twitterInfo,
    } = userInfo;
    let socialDataNew = socialData;
    let img = userInfo.img ? userInfo.img : '';
    const userInfoUpdated = _.omit(userInfo, ['googleInfo', 'fbInfo', 'twitterInfo', 'pwd']);
    const {
        picture
    } = socialData;
    if (picture && picture.data) {
        img = picture.data.url;
        socialDataNew.img = picture.data.url;
        socialDataNew = _.omit(socialDataNew, ['picture', 'cover']);
    }
    if (picture && typeof (picture) === 'string') {
        img = picture;
    }
    return _.merge(userInfoUpdated, googleInfo, fbInfo, twitterInfo, socialDataNew, {
        img
    });
};

module.exports = {
    encryptString,
    decryptString,
    encryptPass,
    generateOtp,
    getRootDir,
    createLoginResponse,
};