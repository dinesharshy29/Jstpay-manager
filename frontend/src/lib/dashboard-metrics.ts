export interface DashboardMetrics {
  total_transactions: number;
  total_volume: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  refunds: number;
  disputes: number;
  chargebacks: number;
  fraud_events: number;
  fraud_prevented: number;
  chargeback_saved: number;
  payment_links: number;
  risk_alerts: number;
  win_rate: number | null;
}

export const emptyMetrics: DashboardMetrics = {
  total_transactions: 0,
  total_volume: 0,
  successful_payments: 0,
  failed_payments: 0,
  pending_payments: 0,
  refunds: 0,
  disputes: 0,
  chargebacks: 0,
  fraud_events: 0,
  fraud_prevented: 0,
  chargeback_saved: 0,
  payment_links: 0,
  risk_alerts: 0,
  win_rate: null,
};