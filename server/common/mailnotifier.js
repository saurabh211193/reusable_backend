import NodeMailer from 'nodemailer';
import SMTP from 'nodemailer-smtp-transport';
import * as Path from 'path';
import Fs from 'fs';
import Config from 'config';
import {
    htmlToText,
} from 'nodemailer-html-to-text';
import {
    getRootDir,
} from '../common/util';

const mailFrom = Config.get('mailFrom');

export class MailNotifier {
    constructor() {
        const root = getRootDir();
        console.log(root);
        this.mailFrom = Config.get('mailFrom');
        this.transporter = NodeMailer.createTransport(SMTP(Config.get('mailCredential')));
        this.transporter.use('compile', htmlToText());
        this.forgetTemplate = this.transporter.templateSender({
            subject: 'Password Reset',
            html: Fs.readFileSync(Path.normalize(`${root}/server/templates/forget.email.html`)).toString(),
        }, {
            from: mailFrom,
        });
        this.verifyTemplate = this.transporter.templateSender({
            subject: 'User Verification',
            html: Fs.readFileSync(Path.normalize(`${root}/server/templates/userverify.email.html`)).toString(),
        }, {
            from: mailFrom,
        });
    }

    sendNormalMail(mailOpts, done) {
        const transport = NodeMailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'afflemailer@gmail.com',
                pass: 'appstudioz',
            },
        });
        transport.sendMail(mailOpts, err => {
            if (err) {
                return done(err);
            }
            return done(null, 'mail sent successfully');
        });
    }
}

export default new MailNotifier();