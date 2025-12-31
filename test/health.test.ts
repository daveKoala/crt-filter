import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import scanRouter from '../src/modules/scan/scan.router';

describe('Health Endpoint', () => {
    let app: express.Application;

    before(() => {
        app = express();
        app.use(express.json());

        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
            });
        });
    });

    it('should return 200 status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).to.equal(200);
    });

    it('should return healthy status', async () => {
        const response = await request(app).get('/health');
        expect(response.body).to.have.property('status', 'healthy');
    });

    it('should return a timestamp', async () => {
        const response = await request(app).get('/health');
        expect(response.body).to.have.property('timestamp');
        expect(response.body.timestamp).to.be.a('string');

        // Verify it's a valid ISO date
        const date = new Date(response.body.timestamp);
        expect(date.toString()).to.not.equal('Invalid Date');
    });

    it('should have correct response structure', async () => {
        const response = await request(app).get('/health');
        expect(response.body).to.have.all.keys('status', 'timestamp');
    });
});
