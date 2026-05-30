import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// html2canvas can't parse `oklch()` color values, which Tailwind v4 emits everywhere
// by default. When PI/Offer/PO documents are converted to canvas, the parser throws
// the moment it encounters one of those colors and the PDF download silently fails
// with "Failed to parse color". We strip every stylesheet inside the cloned DOM and
// inject a minimal hex-only stylesheet that covers only the utility classes our doc
// templates actually use. Inline styles (from <DocumentHeader/>) are kept as-is.
const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; background: #fff; }
  table { border-collapse: collapse; width: 100%; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .text-2xl { font-size: 1.5rem; }
  .text-base { font-size: 1rem; }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }
  .font-mono { font-family: monospace; }
  .tracking-wide { letter-spacing: 0.025em; }
  .text-blue-800 { color: #1e40af; }
  .text-blue-600 { color: #2563eb; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-400 { color: #9ca3af; }
  .text-gray-900 { color: #111827; }
  .bg-white { background-color: #ffffff; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-gray-50 { background-color: #f9fafb; }
  .border { border: 1px solid #9ca3af; }
  .border-b-2 { border-bottom: 2px solid; }
  .border-t { border-top: 1px solid; }
  .border-gray-800 { border-color: #1f2937; }
  .border-gray-400 { border-color: #9ca3af; }
  .border-gray-300 { border-color: #d1d5db; }
  .border-collapse { border-collapse: collapse; }
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: 1fr 1fr; }
  .gap-4 { gap: 1rem; }
  .gap-2 { gap: 0.5rem; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .justify-end { justify-content: flex-end; }
  .items-end { align-items: flex-end; }
  .w-full { width: 100%; }
  .w-8 { width: 2rem; } .w-12 { width: 3rem; } .w-14 { width: 3.5rem; } .w-16 { width: 4rem; }
  .w-20 { width: 5rem; } .w-24 { width: 6rem; } .w-28 { width: 7rem; } .w-32 { width: 8rem; } .w-40 { width: 10rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .p-8 { padding: 2rem; }
  .p-3 { padding: 0.75rem; }
  .p-2 { padding: 0.5rem; }
  .pr-8 { padding-right: 2rem; }
  .pb-4 { padding-bottom: 1rem; }
  .pt-2 { padding-top: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-8 { margin-top: 2rem; }
  .space-y-1 > * + * { margin-top: 0.25rem; }
  .whitespace-pre-line { white-space: pre-line; }
  .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,.05); }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .min-w-\\[260px\\] { min-width: 260px; }
`

export async function downloadDocumentPdf(node: HTMLElement, fileName: string) {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    logging: false,
    onclone: (cloneDoc) => {
      // Drop every stylesheet (Tailwind's oklch palette and all) so html2canvas's
      // color parser never sees an unparseable value.
      cloneDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove())
      const style = cloneDoc.createElement('style')
      style.textContent = PRINT_STYLES
      cloneDoc.head.appendChild(style)
    },
  })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width
  // Always lay down the first page, then add further pages only when the leftover
  // content is meaningfully taller than the tolerance. Without this, a few px of
  // bottom padding / rounding spills onto an otherwise-blank second page.
  const TOL = 10 // mm
  let y = 0
  let remaining = imgH
  pdf.addImage(img, 'PNG', 0, y, pageW, imgH)
  remaining -= pageH
  while (remaining > TOL) {
    y -= pageH
    pdf.addPage()
    pdf.addImage(img, 'PNG', 0, y, pageW, imgH)
    remaining -= pageH
  }
  pdf.save(fileName)
}
