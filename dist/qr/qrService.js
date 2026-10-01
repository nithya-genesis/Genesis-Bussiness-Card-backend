"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const index_js_1 = require("../config/index.js");
class QRService {
    /**
     * Constructs the full public proposal URL from a public token
     */
    static getPublicProposalUrl(publicToken) {
        return `${index_js_1.config.frontendUrl}/proposal/view/${publicToken}`;
    }
    /**
     * Generates a Data URL (base64 image) of the QR code
     */
    static async generateDataUrl(publicToken) {
        const url = this.getPublicProposalUrl(publicToken);
        return qrcode_1.default.toDataURL(url, {
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
    static async generateBuffer(publicToken) {
        const url = this.getPublicProposalUrl(publicToken);
        return qrcode_1.default.toBuffer(url, {
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
    static async generateSvg(publicToken) {
        const url = this.getPublicProposalUrl(publicToken);
        return qrcode_1.default.toString(url, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 2,
        });
    }
}
exports.QRService = QRService;
