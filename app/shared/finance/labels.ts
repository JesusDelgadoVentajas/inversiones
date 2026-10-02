const labels: Record<string, string> = {
  revenue: 'Ingresos', gross_profit: 'Beneficio bruto', operating_income: 'Resultado operativo',
  net_income: 'Beneficio atribuible a la matriz', net_income_common: 'Beneficio atribuible a acciones comunes',
  eps_diluted: 'Beneficio por acción diluido', cash: 'Caja y equivalentes', equity: 'Patrimonio de la matriz',
  common_equity: 'Patrimonio de acciones comunes', current_assets: 'Activo corriente',
  current_liabilities: 'Pasivo corriente', operating_cash_flow: 'Flujo de caja operativo',
  capex: 'Inversión en activos fijos', cash_dividends_common: 'Dividendos de acciones comunes',
  dividend_per_share: 'Dividendo por acción', market_cap: 'Capitalización', debt_total: 'Deuda financiera total',
  debt: 'Deuda financiera', short_term_debt: 'Deuda a corto plazo',
  long_term_debt_current: 'Porción corriente de deuda a largo plazo',
  long_term_debt_noncurrent: 'Porción no corriente de deuda a largo plazo',
  fcf: 'Flujo de caja libre', equity_average: 'Patrimonio medio', price: 'Precio', volume: 'Volumen',
  previous_close: 'Cierre anterior', initial_close: 'Cierre inicial', final_close: 'Cierre final',
  annual_extreme: 'Extremo anual',
}
export function financialLabel(name: string): string {
  if (name.endsWith('_previous')) return financialLabel(name.replace('_previous', '')) + ' del periodo anterior'
  return labels[name] ?? 'Concepto de la fuente: ' + name
}
