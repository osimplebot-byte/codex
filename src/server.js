require('dotenv').config();
const express = require('express');
const logger = require('./logger');
const StatusService = require('./services/statusService');

const app = express();
app.use(express.json({ limit: '1mb' }));

const statusService = StatusService.fromEnv();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/status', async (req, res) => {
  try {
    const { instance } = req.query;
    const instances = instance ? String(instance).split(',').map((value) => value.trim()).filter(Boolean) : [];
    const statuses = await statusService.getStatuses(instances);
    res.json({ data: statuses });
  } catch (error) {
    logger.error({ error: error?.message }, 'Failed to retrieve status');
    res.status(500).json({ error: 'Unable to retrieve status' });
  }
});

app.post('/status/:instance/restart', async (req, res) => {
  try {
    const { instance } = req.params;
    if (!instance) {
      return res.status(400).json({ error: 'Instance is required' });
    }

    const evolutionClient = await statusService.getEvolutionClient(instance);
    if (!evolutionClient) {
      return res.status(503).json({ error: 'Evolution client not configured' });
    }

    const response = await evolutionClient.restart();
    res.json({ data: response });
  } catch (error) {
    logger.error({ error: error?.message }, 'Failed to restart instance');
    res.status(500).json({ error: 'Unable to restart instance' });
  }
});

app.get('/status/:instance/qrcode', async (req, res) => {
  try {
    const { instance } = req.params;
    if (!instance) {
      return res.status(400).json({ error: 'Instance is required' });
    }

    const evolutionClient = await statusService.getEvolutionClient(instance);
    if (!evolutionClient) {
      return res.status(503).json({ error: 'Evolution client not configured' });
    }

    const qrCode = await evolutionClient.getQrCode();
    res.json({ data: qrCode });
  } catch (error) {
    logger.error({ error: error?.message }, 'Failed to retrieve QRCode');
    res.status(500).json({ error: 'Unable to retrieve QR Code' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'Status server running');
});

module.exports = app;
