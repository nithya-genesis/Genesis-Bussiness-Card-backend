import QRCode from 'qrcode';
import { config } from '../config/index.js';

export class QRService {
  /**
   * Constructs the full public proposal URL from a public token
   */
  public static getPublicProposalUrl(publicToken: string): string {
    return `${config.frontendUrl}/proposal/view/${publicToken}`;
  }

  /**
   * Generates a Data URL (base64 image) of the QR code
   */
  public static async generateDataUrl(publicToken: string): Promise<string> {
    const url = this.getPublicProposalUrl(publicToken);
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  }

  /**
   * Generates a Buffer PNG of the QR code for binary streaming / file downloads
   */
  public static async generateBuffer(publicToken: string): Promise<Buffer> {
    const url = this.getPublicProposalUrl(publicToken);
    return QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  }

  /**
   * Generates SVG string for high-res vector rendering
   */
  public static async generateSvg(publicToken: string): Promise<string> {
    const url = this.getPublicProposalUrl(publicToken);
    return QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
    });
  }
}
