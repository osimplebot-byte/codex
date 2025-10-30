const axios = require('axios');
const logger = require('../logger');

class EvolutionClient {
  constructor({ baseURL, instanceKey, token }) {
    if (!baseURL || !instanceKey || !token) {
      throw new Error('EvolutionClient requires baseURL, instanceKey and token');
    }

    this.instanceKey = instanceKey;
    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Evolution-Instance': instanceKey
      },
      timeout: 1000 * 15
    });
  }

  async getStatus() {
    const { data } = await this.http.get(`/instance/${this.instanceKey}/status`);
    return data;
  }

  async restart() {
    const { data } = await this.http.post(`/instance/${this.instanceKey}/restart`);
    return data;
  }

  async getQrCode() {
    const { data } = await this.http.get(`/instance/${this.instanceKey}/qrcode`);
    return data;
  }

  async sendText(number, text) {
    if (!number || !text) {
      throw new Error('sendText requires number and text');
    }

    const { data } = await this.http.post(`/message/sendText/${this.instanceKey}`, {
      number,
      text
    });
    return data;
  }

  static fromEnv() {
    const baseURL = process.env.EVOLUTION_API_BASE_URL;
    const instanceKey = process.env.EVOLUTION_INSTANCE_KEY;
    const token = process.env.EVOLUTION_INSTANCE_TOKEN;

    if (!baseURL || !instanceKey || !token) {
      logger.warn({ baseURL: !!baseURL, instanceKey: !!instanceKey, token: !!token }, 'Evolution env vars missing');
      return null;
    }

    return new EvolutionClient({ baseURL, instanceKey, token });
  }
}

module.exports = EvolutionClient;
