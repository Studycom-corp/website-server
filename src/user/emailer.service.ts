import * as nodemailer from 'nodemailer';
import { MailOptions, Options, SentMessageInfo } from 'nodemailer/lib/smtp-transport';
import { google } from 'googleapis';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter<SentMessageInfo, Options>;
    private clientId: string;
    private clientSecret: string;
    private env: NodeJS.ProcessEnv;
    private refreshToken: string;
    private oAuth2Client;

    constructor() {
        this.env = process.env;
        this.clientId = this.env.GOOGLE_OAUTH_CLIENT_ID;
        this.clientSecret = this.env.GOOGLE_OAUTH_CLIENT_SECRET;
        this.refreshToken = this.env.GOOGLE_OAUTH_REFRESH_TOKEN;

        this.oAuth2Client = new google.auth.OAuth2({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            redirectUri: "http://localhost:3000/oauth2callback"
        });
        console.log("OAuth2 client: ", this.oAuth2Client)

        this.oAuth2Client.setCredentials({
            refresh_token: this.refreshToken,
            access_token: "ya29.a0AcM612zWuRH9vorZ3jV43tWC2K-FBsFt81LGTPbdMl33rdXV4917L8lz263R2OUNKhPFm3u3-dQ3Lpck9qMDWPnZbqGdIQ_mqBf-j7TjTba_dBo9Bq5wHpvwzhpK7bzxFUkuxT4pRV_iKUVOUeM_L4jpXLJ5s49R5DU1j9r1aCgYKAVYSARESFQHGX2Mi063HOG3ETlTaBkiTBTs11A0175"
        });
    }

    async initTransporter() {
        let accessToken: { token: any; };
        try {
            console.log("Obtaining access token")
            accessToken = await this.oAuth2Client.getAccessToken();
            console.log("Access token: ", accessToken)
        } catch (error) {
            throw new InternalServerErrorException(error)
        }

        this.transporter = nodemailer.createTransport({
            host: this.env.SMTP_HOST,
            port: parseInt(this.env.SMTP_PORT, 10),
            secure: false,
            auth: {
                type: 'OAuth2',
                user: this.env.SMTP_USER,
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                refreshToken: this.refreshToken,
                accessToken: accessToken.token ?? ""
            },
            logger: true,
            debug: true
        });
    }

    async sendEmail(target: string, subject: string, text: string, html: string) {
        if (!this.transporter) {
            await this.initTransporter();
        }

        const emailOptions: MailOptions = {
            from: this.env.SMTP_USER,
            to: target,
            subject,
            text,
            html
        };

        try {
            await this.transporter.sendMail(emailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}
