const { createClient } = require('@supabase/supabase-js');
const EvolutionClient = require('./evolutionClient');
const logger = require('../logger');

class StatusService {
  constructor({
    supabaseUrl,
    supabaseKey,
    statusTable = 'whatsapp_connection_status',
    evolutionClient = null,
    defaultInstance = null
  }) {
    this.statusTable = statusTable;
    this.evolutionClient = evolutionClient;
    this.defaultInstance = defaultInstance;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } else {
      this.supabase = null;
    }
  }

  static fromEnv() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const statusTable = process.env.SUPABASE_STATUS_TABLE || 'whatsapp_connection_status';
    const evolutionClient = EvolutionClient.fromEnv();
    const defaultInstance = process.env.EVOLUTION_DEFAULT_INSTANCE || evolutionClient?.instanceKey || null;

    return new StatusService({ supabaseUrl, supabaseKey, statusTable, evolutionClient, defaultInstance });
  }

  async fetchFromSupabase(instances) {
    if (!this.supabase) {
      return [];
    }

    let query = this.supabase
      .from(this.statusTable)
      .select('*')
      .order('last_checked_at', { ascending: false });

    if (instances && instances.length > 0) {
      query = query.in('instance', instances);
    }

    const { data, error } = await query;
    if (error) {
      logger.error({ error }, 'Failed to fetch statuses from Supabase');
      return [];
    }

    return data.map((row) => ({
      instance: row.instance,
      status: row.status,
      lastCheckedAt: row.last_checked_at,
      lastConnectedAt: row.last_connected_at,
      attemptingReconnect: row.attempting_reconnect,
      metadata: row.metadata || {}
    }));
  }

  async listKnownInstances() {
    if (!this.supabase) {
      return this.evolutionClient ? [this.defaultInstance || this.evolutionClient.instanceKey] : [];
    }

    const [statusRows, integrationRows] = await Promise.all([
      this.supabase.from(this.statusTable).select('instance'),
      this.supabase.from('integration_settings').select('instance')
    ]);

    const instances = new Set();

    if (statusRows.error) {
      logger.warn({ error: statusRows.error }, 'Error listing instances from status table');
    } else if (statusRows.data) {
      statusRows.data.forEach((row) => instances.add(row.instance));
    }

    if (integrationRows.error) {
      logger.warn({ error: integrationRows.error }, 'Error listing instances from integration settings');
    } else if (integrationRows.data) {
      integrationRows.data.forEach((row) => instances.add(row.instance));
    }

    if (instances.size === 0 && this.evolutionClient) {
      instances.add(this.defaultInstance || this.evolutionClient.instanceKey);
    }

    return Array.from(instances).filter(Boolean);
  }

  async getIntegrationSettings(instance) {
    if (!this.supabase || !instance) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('integration_settings')
      .select('instance, evolution_instance_key, evolution_token')
      .eq('instance', instance)
      .maybeSingle();

    if (error) {
      logger.error({ error, instance }, 'Failed to fetch integration settings');
      return null;
    }

    return data;
  }

  async resolveEvolutionClient(instance) {
    if (!instance) {
      return null;
    }

    const matchesDefault =
      this.evolutionClient &&
      (this.evolutionClient.instanceKey === instance || this.defaultInstance === instance);

    if (matchesDefault) {
      return this.evolutionClient;
    }

    const settings = await this.getIntegrationSettings(instance);
    const baseURL = process.env.EVOLUTION_API_BASE_URL;

    if (!settings) {
      logger.warn({ instance }, 'No integration settings found');
      return null;
    }

    if (!baseURL || !settings.evolution_instance_key || !settings.evolution_token) {
      logger.warn({ instance }, 'Incomplete Evolution credentials');
      return null;
    }

    return new EvolutionClient({
      baseURL,
      instanceKey: settings.evolution_instance_key,
      token: settings.evolution_token
    });
  }

  async getEvolutionClient(instance) {
    if (instance) {
      return this.resolveEvolutionClient(instance);
    }
    return this.evolutionClient;
  }

  async fetchFromEvolution(instances) {
    const hasEvolution = this.evolutionClient || process.env.EVOLUTION_API_BASE_URL;
    if (!hasEvolution) {
      return [];
    }

    const defaultInstance = this.defaultInstance || this.evolutionClient?.instanceKey;

    let instanceList =
      instances && instances.length > 0
        ? instances
        : defaultInstance
        ? [defaultInstance]
        : [];

    if (instanceList.length === 0) {
      instanceList = await this.listKnownInstances();
    }

    const results = await Promise.all(
      instanceList.map(async (instance) => {
        try {
          const client = await this.getEvolutionClient(instance);
          if (!client) {
            throw new Error('Evolution client not configured for instance');
          }

          const status = await client.getStatus();
          return {
            instance,
            status: this.translateStatus(status?.state),
            lastCheckedAt: new Date().toISOString(),
            lastConnectedAt: status?.lastConnectedAt || null,
            attemptingReconnect: status?.state !== 'CONNECTED',
            metadata: status || {}
          };
        } catch (error) {
          logger.error({ error: error?.message, instance }, 'Failed to fetch status from Evolution API');
          return {
            instance,
            status: 'DISCONNECTED',
            lastCheckedAt: new Date().toISOString(),
            lastConnectedAt: null,
            attemptingReconnect: true,
            metadata: { error: error?.message }
          };
        }
      })
    );

    return results;
  }

  translateStatus(state) {
    if (!state) return 'DISCONNECTED';
    const normalized = state.toUpperCase();
    if (normalized.includes('CONNECTED')) {
      return 'CONNECTED';
    }
    if (['LOADING', 'INITIALIZING', 'QRCODE', 'PAIRING', 'CONNECTING'].includes(normalized)) {
      return 'CONNECTING';
    }
    return 'DISCONNECTED';
  }

  mergeStatuses(primary, secondary) {
    const merged = new Map();
    [...secondary, ...primary].forEach((status) => {
      if (!status?.instance) {
        return;
      }
      const existing = merged.get(status.instance);
      if (!existing || new Date(status.lastCheckedAt) > new Date(existing.lastCheckedAt || 0)) {
        merged.set(status.instance, status);
      }
    });
    return Array.from(merged.values());
  }

  async getStatuses(instances = []) {
    const [supabaseStatuses, evolutionStatuses] = await Promise.all([
      this.fetchFromSupabase(instances),
      this.fetchFromEvolution(instances)
    ]);

    const merged = this.mergeStatuses(evolutionStatuses, supabaseStatuses);

    return merged.length > 0
      ? merged
      : [
          {
            instance: instances[0] || this.defaultInstance || this.evolutionClient?.instanceKey || 'unknown-instance',
            status: 'DISCONNECTED',
            lastCheckedAt: new Date().toISOString(),
            attemptingReconnect: true,
            metadata: { message: 'Sem dados disponíveis' }
          }
        ];
  }
}

module.exports = StatusService;
