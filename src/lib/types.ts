export interface UserRecord {
  email?: string;
  firstName?: string;
  lastName?: string;
  monthly_income?: number;
  credit_score?: number;
  net_worth?: number;
}

export interface AssetRecord {
  id?: string | number;
  user_email?: string;
  name: string;
  type?: string;
  value: number;
}

export interface LiabilityRecord {
  id?: string | number;
  user_email?: string;
  name: string;
  type?: string;
  amount: number;
  interest_rate?: number;
}

export interface InvestmentRecord {
  id?: string | number;
  user_email?: string;
  name: string;
  type?: string;
  shares?: number;
  current_price?: number;
  total_value: number;
  gain_loss: number;
  gain_loss_percentage: number;
}

export interface PpfRecord {
  user_email?: string;
  total_balance?: number;
  annual_contribution?: number;
  interest_rate?: number;
}

export interface FinancialData {
  user: UserRecord | null;
  assets: AssetRecord[];
  liabilities: LiabilityRecord[];
  investments: InvestmentRecord[];
  ppf: PpfRecord | null;
}

export interface ChartsData {
  monthly: Record<string, number>;
  yearly: Record<string, number>;
  credit: number;
  debit: number;
}

