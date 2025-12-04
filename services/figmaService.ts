/**
 * Serviço de integração com Figma API
 * Sincroniza design tokens e estilos do Figma para o projeto
 */
import axios from 'axios';
import { logger } from '../utils/logger';

export interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
}

export interface FigmaVariable {
  id: string;
  name: string;
  type: string;
  valuesByMode: Record<string, unknown>;
  resolvedType: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description?: string;
}

export interface FigmaTokensResponse {
  variables: FigmaVariable[];
  styles: FigmaStyle[];
}

/**
 * Classe para interagir com a API do Figma
 */
export class FigmaService {
  private apiToken: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.VITE_FIGMA_API_TOKEN || '';
    
    if (!this.apiToken) {
      logger.warn('Figma API token não configurado. Configure VITE_FIGMA_API_TOKEN');
    }
  }

  /**
   * Obtém informações de um arquivo do Figma
   */
  async getFile(fileKey: string): Promise<unknown> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.apiToken,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar arquivo do Figma', 'FigmaService', error);
      throw error;
    }
  }

  /**
   * Obtém variáveis locais de um arquivo do Figma
   */
  async getLocalVariables(fileKey: string): Promise<FigmaVariable[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/files/${fileKey}/variables/local`,
        {
          headers: {
            'X-Figma-Token': this.apiToken,
          },
        }
      );
      return response.data.meta?.variables || [];
    } catch (error) {
      logger.error('Erro ao buscar variáveis do Figma', 'FigmaService', error);
      throw error;
    }
  }

  /**
   * Obtém estilos de um arquivo do Figma
   */
  async getStyles(fileKey: string): Promise<FigmaStyle[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}/styles`, {
        headers: {
          'X-Figma-Token': this.apiToken,
        },
      });
      return response.data.meta?.styles || [];
    } catch (error) {
      logger.error('Erro ao buscar estilos do Figma', 'FigmaService', error);
      throw error;
    }
  }

  /**
   * Obtém todos os tokens (variáveis e estilos) de um arquivo
   */
  async getTokens(fileKey: string): Promise<FigmaTokensResponse> {
    try {
      const [variables, styles] = await Promise.all([
        this.getLocalVariables(fileKey),
        this.getStyles(fileKey),
      ]);

      return {
        variables,
        styles,
      };
    } catch (error) {
      logger.error('Erro ao buscar tokens do Figma', 'FigmaService', error);
      throw error;
    }
  }

  /**
   * Converte variáveis do Figma para formato de design tokens
   */
  convertVariablesToTokens(variables: FigmaVariable[]): Record<string, unknown> {
    const tokens: Record<string, unknown> = {};

    variables.forEach((variable) => {
      const path = variable.name.split('/');
      let current = tokens;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = path[path.length - 1];
      const value = Object.values(variable.valuesByMode)[0];

      current[lastKey] = {
        value: this.convertFigmaValue(value, variable.resolvedType),
        type: this.mapFigmaTypeToTokenType(variable.resolvedType),
      };
    });

    return tokens;
  }

  /**
   * Converte valor do Figma para formato de token
   */
  private convertFigmaValue(value: unknown, type: string): string | number {
    if (typeof value === 'object' && value !== null) {
      const figmaValue = value as Record<string, unknown>;
      
      if (type === 'COLOR') {
        const r = (figmaValue.r as number) * 255;
        const g = (figmaValue.g as number) * 255;
        const b = (figmaValue.b as number) * 255;
        const a = figmaValue.a as number | undefined;
        
        if (a !== undefined && a < 1) {
          return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      }
    }
    
    return String(value);
  }

  /**
   * Mapeia tipo do Figma para tipo de token
   */
  private mapFigmaTypeToTokenType(figmaType: string): string {
    const typeMap: Record<string, string> = {
      COLOR: 'color',
      FLOAT: 'dimension',
      STRING: 'string',
    };
    return typeMap[figmaType] || 'string';
  }

  /**
   * Valida se o token da API está configurado
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }
}

/**
 * Instância singleton do serviço
 */
export const figmaService = new FigmaService();

