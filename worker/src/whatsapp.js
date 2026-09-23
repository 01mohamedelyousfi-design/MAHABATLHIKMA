/**
 * whatsapp.js — WhatsAppProvider abstraction.
 *
 * The learning engine only ever talks to the WhatsAppProvider interface:
 *
 *   interface WhatsAppProvider {
 *     sendMessage(to: string, message: string): Promise<void>
 *     sendTemplateMessage?(to: string, template: string, params: object): Promise<void>
 *   }
 *
 * Implementations:
 *   - MetaWhatsAppProvider : official WhatsApp Business Cloud API (Meta Graph).
 *                            The only official free-tier route: no scraping,
 *                            no reverse-engineered sessions.
 *   - MockWhatsAppProvider : development/testing. Records messages in D1.
 *
 * Selected by env.WHATSAPP_PROVIDER ('meta' | 'mock', default 'mock').
 */

export class MockWhatsAppProvider {
  constructor(db) { this.db = db; }
  async sendMessage(to, message) {
    if (this.db) {
      await this.db
        .prepare('INSERT INTO whatsapp_events (direction, wa_id, body, kind) VALUES (?, ?, ?, ?)')
        .bind('out', to, message, 'mock')
        .run();
    }
    return { mock: true };
  }
  async sendTemplateMessage(to, template, params) {
    return this.sendMessage(to, `[template:${template}] ${JSON.stringify(params || {})}`);
  }
}

export class MetaWhatsAppProvider {
  /**
   * @param {object} cfg { phoneNumberId, token, db }
   */
  constructor(cfg) {
    this.phoneNumberId = cfg.phoneNumberId;
    this.token = cfg.token;
    this.db = cfg.db || null;
    this.apiBase = `https://graph.facebook.com/v21.0/${this.phoneNumberId}`;
  }
  async sendMessage(to, message) {
    const res = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: true, body: message },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      await this._log('error', to, `${res.status}: ${errBody}`, 'send_error');
      throw new Error(`WhatsApp send failed: ${res.status}`);
    }
    await this._log('out', to, message, 'text');
  }
  async sendTemplateMessage(to, template, params) {
    const res = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'ar' },
          components: params && params.body
            ? [{ type: 'body', parameters: params.body.map((t) => ({ type: 'text', text: String(t) })) }]
            : [],
        },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      await this._log('error', to, `${res.status}: ${errBody}`, 'template_error');
      throw new Error(`WhatsApp template send failed: ${res.status}`);
    }
    await this._log('out', to, `[template:${template}]`, 'template');
  }
  async _log(direction, waId, body, kind) {
    if (!this.db) return;
    try {
      await this.db
        .prepare('INSERT INTO whatsapp_events (direction, wa_id, body, kind) VALUES (?, ?, ?, ?)')
        .bind(direction, waId, body, kind)
        .run();
    } catch { /* logging must never break messaging */ }
  }
}

/** Factory: build the configured provider from Worker env. */
export function buildWhatsAppProvider(env) {
  if (env.WHATSAPP_PROVIDER === 'meta' && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_TOKEN) {
    return new MetaWhatsAppProvider({
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
      token: env.WHATSAPP_TOKEN,
      db: env.DB,
    });
  }
  return new MockWhatsAppProvider(env.DB);
}
