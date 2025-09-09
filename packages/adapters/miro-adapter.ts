import { BaseAdapter, IAdapterConfig, AdapterError } from './types/adapter';

export class MiroAdapter extends BaseAdapter {
  private boardUrl: string = '';

  constructor(defaultConfig: Partial<IAdapterConfig> = {}) {
    super({ baseUrl: 'https://miro.com', ...defaultConfig });
  }

  async init(config: Partial<IAdapterConfig>): Promise<void> {
    await super.init(config);
    // Miro doesn't require API key for embedding, so no additional setup needed
  }

  // Custom init method for board URL
  async initBoard(boardUrl: string): Promise<void> {
    if (!boardUrl) {
      throw new AdapterError('Board URL is required', { code: 'INVALID_BOARD_URL' });
    }
    this.boardUrl = boardUrl;
  }

  // Get embed URL for the board
  getEmbedUrl(): string {
    if (!this.boardUrl) {
      throw new AdapterError('Board URL not initialized', { code: 'BOARD_URL_NOT_SET' });
    }

    // Extract board ID from URL
    const boardIdMatch = this.boardUrl.match(/\/board\/([a-zA-Z0-9_-]+)/);
    if (!boardIdMatch) {
      throw new AdapterError('Invalid Miro board URL format', { code: 'INVALID_BOARD_URL' });
    }

    const boardId = boardIdMatch[1];
    return `https://miro.com/app/embed/${boardId}/`;
  }

  // Required abstract methods from BaseAdapter
  async execute(_operation: string, _params: any): Promise<any> {
    throw new AdapterError('Execute not implemented for MiroAdapter', { code: 'NOT_IMPLEMENTED' });
  }

  async listResources(_type: string): Promise<any[]> {
    throw new AdapterError('List resources not implemented for MiroAdapter', { code: 'NOT_IMPLEMENTED' });
  }

  async healthCheck(): Promise<boolean> {
    // For MVP, just check if board URL is set
    return !!this.boardUrl;
  }

  async close(): Promise<void> {
    // No connections to close for Miro embedding
  }
}