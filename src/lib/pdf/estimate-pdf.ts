import type { Estimate, EstimateSection, EstimateItem } from '@/types/database'

interface FullEstimate extends Estimate {
  sections: (EstimateSection & { items: EstimateItem[] })[]
}

export interface OrgBranding {
  name: string
  logo_url?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

function usd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)
}

function fmtDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Gera um PDF do estimate abrindo uma janela de impressão formatada como
 * documento comercial. O usuário escolhe "Salvar como PDF" no diálogo de impressão.
 * Abordagem sem dependência externa — compatível com Cloudflare Edge Runtime.
 *
 * A marca visível é a do contratante (org, logo, contato) — a plataforma aparece
 * só como um selo discreto no rodapé ("Powered by ConstructOS"), sem white-label.
 */
export function generateEstimatePDF(
  estimate: FullEstimate,
  org: OrgBranding = { name: 'ConstructOS' },
  creatorName?: string
) {
  const rows = estimate.sections
    .map((section) => {
      const itemRows = section.items
        .map(
          (item) => `
          <tr>
            <td class="desc">${esc(item.description) || '—'}</td>
            <td class="num">${Number(item.qty ?? 0)}</td>
            <td class="num">${esc(item.unit) || '—'}</td>
            <td class="num">${usd(Number(item.unit_price ?? 0))}</td>
            <td class="num">${Number(item.labor_hours ?? 0)}h</td>
            <td class="num">${usd(Number(item.labor_rate ?? 0))}</td>
            <td class="num total">${usd(Number(item.line_total ?? 0))}</td>
          </tr>`
        )
        .join('')
      const sectionTotal = section.items.reduce((s, i) => s + Number(i.line_total ?? 0), 0)
      return `
        <tr class="section-row">
          <td colspan="6">${esc(section.name)}</td>
          <td class="num">${usd(sectionTotal)}</td>
        </tr>
        ${itemRows}`
    })
    .join('')

  const orgContactLines = [org.phone, org.email, org.address].filter(Boolean)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(estimate.estimate_number)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F6E56; padding-bottom: 20px; margin-bottom: 24px; gap: 24px; }
  .brand-block { display: flex; align-items: center; gap: 12px; }
  .brand-logo { max-height: 48px; max-width: 160px; object-fit: contain; }
  .brand { font-size: 22px; font-weight: 700; color: #0F6E56; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 2px; }
  .brand-contact { font-size: 10px; color: #888; margin-top: 4px; line-height: 1.4; }
  .doc-meta { text-align: right; flex-shrink: 0; }
  .doc-number { font-size: 16px; font-weight: 700; }
  .doc-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 24px; gap: 40px; }
  .party { flex: 1; }
  .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
  .party p { font-size: 13px; margin-bottom: 2px; }
  .party .name { font-weight: 600; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #0F6E56; color: white; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; padding: 8px 10px; text-align: left; }
  thead th.num { text-align: right; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
  tbody td.num { text-align: right; }
  tbody td.total { font-weight: 600; }
  tr.section-row td { background: #f4f8f6; font-weight: 700; font-size: 12px; color: #0F6E56; border-top: 1px solid #d5e8e0; }
  .totals { margin-left: auto; width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals-row.grand { border-top: 2px solid #0F6E56; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #0F6E56; }
  .totals-row .muted { color: #666; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; display: flex; justify-content: space-between; align-items: center; }
  .footer .powered-by { font-size: 9px; color: #bbb; }
  @media print { body { padding: 20px; } @page { margin: 1cm; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand-block">
      ${org.logo_url ? `<img class="brand-logo" src="${esc(org.logo_url)}" alt="${esc(org.name)}" />` : ''}
      <div>
        <div class="brand">${esc(org.name)}</div>
        <div class="brand-sub">Construction Estimate</div>
        ${orgContactLines.length > 0 ? `<div class="brand-contact">${orgContactLines.map(esc).join(' · ')}</div>` : ''}
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-label">Estimate</div>
      <div class="doc-number">${esc(estimate.estimate_number)}</div>
      <div class="brand-sub">Valid until: ${fmtDate(estimate.valid_until)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Bill To</h3>
      <p class="name">${esc(estimate.client?.name) || '—'}</p>
      ${estimate.client?.email ? `<p>${esc(estimate.client.email)}</p>` : ''}
      ${estimate.client?.phone ? `<p>${esc(estimate.client.phone)}</p>` : ''}
      ${estimate.client?.address ? `<p>${esc(estimate.client.address)}</p>` : ''}
      ${estimate.client?.city ? `<p>${esc(estimate.client.city)}</p>` : ''}
    </div>
    <div class="party">
      <h3>Project Scope</h3>
      <p>${esc(estimate.scope) || '—'}</p>
      ${estimate.service_type?.name ? `<p class="muted">${esc(estimate.service_type.name)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Unit $</th>
        <th class="num">Labor</th>
        <th class="num">Rate</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span class="muted">Materials</span><span>${usd(Number(estimate.subtotal_materials ?? 0))}</span></div>
    <div class="totals-row"><span class="muted">Materials Tax (${Number(estimate.tax_pct ?? 0)}%)</span><span>${usd(Number(estimate.tax_amount ?? 0))}</span></div>
    <div class="totals-row"><span class="muted">Labor</span><span>${usd(Number(estimate.subtotal_labor ?? 0))}</span></div>
    ${Number(estimate.subtotal_other ?? 0) > 0 ? `<div class="totals-row"><span class="muted">Other</span><span>${usd(Number(estimate.subtotal_other))}</span></div>` : ''}
    <div class="totals-row"><span class="muted">Subtotal</span><span>${usd(Number(estimate.grand_total ?? 0))}</span></div>
    <div class="totals-row"><span class="muted">Margin (${Number(estimate.profit_margin_pct ?? 0)}%)</span><span>${usd(Number(estimate.total_with_margin ?? 0) - Number(estimate.grand_total ?? 0))}</span></div>
    <div class="totals-row grand"><span>Total</span><span>${usd(Number(estimate.total_with_margin ?? 0))}</span></div>
  </div>

  <div class="footer">
    <span>${creatorName ? `Prepared by ${esc(creatorName)}` : `Prepared by ${esc(org.name)}`} · ${new Date().toLocaleDateString('en-US')}</span>
    <span class="powered-by">Powered by ConstructOS</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    alert('Habilite pop-ups para gerar o PDF.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
}
