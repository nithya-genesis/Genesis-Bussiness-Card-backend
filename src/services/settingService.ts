import { prisma } from '../models/prisma.js';
import { config } from '../config/index.js';

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export interface AllSystemSettings {
  company: CompanySettings;
  currency: string;
  defaultGstRate: number;
  defaultHourlyRate: number;
  minStudentsDefault: number;
  maxStudentsDefault: number;
  proposalValidityDays: number;
}

export class SettingService {
  /**
   * Returns all global system settings from database with clean fallbacks
   */
  public static async getAllSettings(): Promise<AllSystemSettings> {
    const settingsMap = await this.getSettingsMap();

    const companyName = settingsMap.get('COMPANY_NAME') || config.company.name;
    const companyTagline = settingsMap.get('COMPANY_TAGLINE') || config.company.tagline;
    const companyAddress = settingsMap.get('COMPANY_ADDRESS') || config.company.address;
    const companyEmail = settingsMap.get('COMPANY_EMAIL') || config.company.email;
    const companyPhone = settingsMap.get('COMPANY_PHONE') || config.company.phone;
    const companyWebsite = settingsMap.get('COMPANY_WEBSITE') || config.company.website;

    const currency = settingsMap.get('CURRENCY') || 'INR';

    const rawGst = settingsMap.get('DEFAULT_GST_RATE');
    const defaultGstRate = rawGst !== undefined && !isNaN(parseFloat(rawGst)) ? parseFloat(rawGst) : 18.0;

    const rawHourly = settingsMap.get('DEFAULT_HOURLY_RATE');
    const defaultHourlyRate = rawHourly !== undefined && !isNaN(parseFloat(rawHourly)) ? parseFloat(rawHourly) : config.defaultHourlyRate;

    const rawMin = settingsMap.get('MIN_STUDENTS_DEFAULT');
    const minStudentsDefault = rawMin !== undefined && !isNaN(parseInt(rawMin, 10)) ? parseInt(rawMin, 10) : 50;

    const rawMax = settingsMap.get('MAX_STUDENTS_DEFAULT');
    const maxStudentsDefault = rawMax !== undefined && !isNaN(parseInt(rawMax, 10)) ? parseInt(rawMax, 10) : 2000;

    const rawValidity = settingsMap.get('PROPOSAL_VALIDITY_DAYS');
    const proposalValidityDays = rawValidity !== undefined && !isNaN(parseInt(rawValidity, 10)) ? parseInt(rawValidity, 10) : config.proposalTokenExpiryDays;

    return {
      company: {
        name: companyName,
        tagline: companyTagline,
        address: companyAddress,
        email: companyEmail,
        phone: companyPhone,
        website: companyWebsite,
      },
      currency,
      defaultGstRate,
      defaultHourlyRate,
      minStudentsDefault,
      maxStudentsDefault,
      proposalValidityDays,
    };
  }

  public static async getCompanySettings(): Promise<CompanySettings> {
    const all = await this.getAllSettings();
    return all.company;
  }

  public static async getDefaultGstRate(): Promise<number> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEFAULT_GST_RATE' } });
      if (setting && setting.value) {
        const val = parseFloat(setting.value);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {
      // Fallback
    }
    return 18.0;
  }

  public static async getDefaultHourlyRate(): Promise<number> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'DEFAULT_HOURLY_RATE' } });
      if (setting && setting.value) {
        const val = parseFloat(setting.value);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // Fallback
    }
    return config.defaultHourlyRate;
  }

  public static async getProposalValidityDays(): Promise<number> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'PROPOSAL_VALIDITY_DAYS' } });
      if (setting && setting.value) {
        const val = parseInt(setting.value, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // Fallback
    }
    return config.proposalTokenExpiryDays;
  }

  public static async getCurrency(): Promise<string> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'CURRENCY' } });
      if (setting && setting.value) return setting.value;
    } catch {
      // Fallback
    }
    return 'INR';
  }

  public static async getStudentDefaults(): Promise<{ min: number; max: number }> {
    try {
      const [minSetting, maxSetting] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: 'MIN_STUDENTS_DEFAULT' } }),
        prisma.systemSetting.findUnique({ where: { key: 'MAX_STUDENTS_DEFAULT' } }),
      ]);
      const min = minSetting?.value ? parseInt(minSetting.value, 10) : 50;
      const max = maxSetting?.value ? parseInt(maxSetting.value, 10) : 2000;
      return {
        min: !isNaN(min) && min > 0 ? min : 50,
        max: !isNaN(max) && max > 0 ? max : 2000,
      };
    } catch {
      return { min: 50, max: 2000 };
    }
  }

  private static async getSettingsMap(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const rows = await prisma.systemSetting.findMany();
      for (const row of rows) {
        map.set(row.key, row.value);
      }
    } catch {
      // DB not ready or error
    }
    return map;
  }
}
