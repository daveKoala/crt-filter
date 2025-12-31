import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import sinon from 'sinon';

describe('Scan Endpoint', () => {
    let app: express.Application;

    before(() => {
        app = express();
        app.use(express.json());

        app.post('/scan', (req, res) => {
            const { logs, window, startingIndex = 1000000 } = req.body;

            res.status(200).json({
                message: 'Scan started',
                logs,
                window,
                startingIndex
            });
        });
    });

    it('should return 200 status', async () => {
        const response = await request(app)
            .post('/scan')
            .send({
                logs: ['google-argon2023'],
                window: '6months'
            });

        expect(response.status).to.equal(200);
    });

    it('should accept valid scan request', async () => {
        const requestBody = {
            logs: ['google-argon2023'],
            window: '6months'
        };

        const response = await request(app)
            .post('/scan')
            .send(requestBody);

        expect(response.body).to.have.property('message', 'Scan started');
        expect(response.body).to.have.property('logs').that.deep.equals(['google-argon2023']);
        expect(response.body).to.have.property('window', '6months');
    });

    it('should use default startingIndex when not provided', async () => {
        const response = await request(app)
            .post('/scan')
            .send({
                logs: ['google-argon2023'],
                window: '6months'
            });

        expect(response.body).to.have.property('startingIndex', 1000000);
    });

    it('should accept custom startingIndex', async () => {
        const response = await request(app)
            .post('/scan')
            .send({
                logs: ['google-argon2023'],
                window: '6months',
                startingIndex: 5000000
            });

        expect(response.body).to.have.property('startingIndex', 5000000);
    });

    it('should accept different time windows', async () => {
        const testCases = ['1month', '6months', '1year', '30days'];

        for (const window of testCases) {
            const response = await request(app)
                .post('/scan')
                .send({
                    logs: ['google-argon2023'],
                    window
                });

            expect(response.body).to.have.property('window', window);
        }
    });

    it('should have correct response structure', async () => {
        const response = await request(app)
            .post('/scan')
            .send({
                logs: ['google-argon2023'],
                window: '6months'
            });

        expect(response.body).to.have.all.keys('message', 'logs', 'window', 'startingIndex');
    });
});
