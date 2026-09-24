// ============================================================
// EDUFLOW FEE CALCULATION ENGINE
// Pure TypeScript — no database calls, no side effects.
// Same function runs on server (before save) and client (live preview).
// ============================================================

export interface FeeInput {
  studentName: string
  studentType: 'new' | 'returning'
  gradeId: string
  gradeNameEn: string
  gradeNameAr: string

  // Mandatory fees for this grade
  feeItems: FeeItemInput[]

  // Discounts the staff has applied
  discounts: DiscountInput[]

  // Optional add-ons selected
  addons: AddonInput[]

  // Optional transport zone selected
  transport: TransportInput | null

  // Tax rule for this family (based on nationality)
  taxRule: TaxRuleInput | null
}

export interface FeeItemInput {
  id: string
  feeItemId: string
  descriptionEn: string
  descriptionAr: string
  amount: number
  isTextable: boolean
}

export interface DiscountInput {
  discountTypeId: string
  descriptionEn: string
  descriptionAr: string
  discountPercent: number
  appliesTo: 'tuition' | 'total'
}

export interface AddonInput {
  addonPackageId: string
  descriptionEn: string
  descriptionAr: string
  amount: number
  isTaxable: boolean
}

export interface TransportInput {
  transportZoneId: string
  descriptionEn: string
  descriptionAr: string
  amount: number
}

export interface TaxRuleInput {
  name_en: string
  name_ar: string
  rate: number  // e.g. 0.15 for 15%
}

// ---- OUTPUTS ----

export interface LineItem {
  lineType: 'fee' | 'discount' | 'tax' | 'addon' | 'transport'
  descriptionEn: string
  descriptionAr: string
  feeItemId?: string
  discountTypeId?: string
  addonPackageId?: string
  transportZoneId?: string
  unitAmount: number
  quantity: number
  discountPercent?: number
  lineTotal: number
  displayOrder: number
}

export interface StudentResult {
  studentName: string
  studentType: 'new' | 'returning'
  gradeId: string
  gradeNameEn: string
  gradeNameAr: string
  lines: LineItem[]
  baseTuition: number
  discountAmount: number
  taxAmount: number
  addonsTotal: number
  studentTotal: number
}

export interface QuotationResult {
  students: StudentResult[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  requiresApproval: boolean
  approvalReasons: string[]
}

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

export function calculateQuotation(
  students: FeeInput[],
  approvalThresholds: { discountTypeId: string; threshold: number }[]
): QuotationResult {
  const studentResults: StudentResult[] = []
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0
  let grandTotal = 0
  const approvalReasons: string[] = []

  for (const [index, student] of students.entries()) {
    const result = calculateStudent(student, index, approvalThresholds, approvalReasons)
    studentResults.push(result)
    subtotal += result.baseTuition
    discountTotal += result.discountAmount
    taxTotal += result.taxAmount
    grandTotal += result.studentTotal
  }

  return {
    students: studentResults,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    requiresApproval: approvalReasons.length > 0,
    approvalReasons,
  }
}

function calculateStudent(
  input: FeeInput,
  studentIndex: number,
  approvalThresholds: { discountTypeId: string; threshold: number }[],
  approvalReasons: string[]
): StudentResult {
  const lines: LineItem[] = []
  let order = 0

  // ---- TUITION FEE LINES ----
  let baseTuition = 0
  for (const feeItem of input.feeItems) {
    baseTuition += feeItem.amount
    lines.push({
      lineType: 'fee',
      descriptionEn: feeItem.descriptionEn,
      descriptionAr: feeItem.descriptionAr,
      feeItemId: feeItem.feeItemId,
      unitAmount: feeItem.amount,
      quantity: 1,
      lineTotal: feeItem.amount,
      displayOrder: order++,
    })
  }

  // ---- DISCOUNT LINES ----
  let totalDiscountAmount = 0
  for (const discount of input.discounts) {
    const baseForDiscount = discount.appliesTo === 'tuition' ? baseTuition : baseTuition

    const discountAmount = round2(baseForDiscount * (discount.discountPercent / 100))
    totalDiscountAmount += discountAmount

    lines.push({
      lineType: 'discount',
      descriptionEn: discount.descriptionEn,
      descriptionAr: discount.descriptionAr,
      discountTypeId: discount.discountTypeId,
      unitAmount: discountAmount,
      quantity: 1,
      discountPercent: discount.discountPercent,
      lineTotal: -discountAmount,  // negative for display
      displayOrder: order++,
    })

    // Check approval threshold for this discount type
    const threshold = approvalThresholds.find(
      t => t.discountTypeId === discount.discountTypeId
    )
    if (threshold && discount.discountPercent > threshold.threshold) {
      approvalReasons.push(
        `Student ${studentIndex + 1} (${input.studentName}): ${discount.descriptionEn} is ${discount.discountPercent}%, which exceeds the ${threshold.threshold}% approval threshold.`
      )
    }
  }

  const netTuition = round2(baseTuition - totalDiscountAmount)

  // ---- TAX LINE ----
  let taxAmount = 0
  if (input.taxRule && input.taxRule.rate > 0) {
    // Tax applies only to taxable fee items (tuition is typically taxable)
    const taxableBase = input.feeItems
      .filter(f => f.isTextable)
      .reduce((sum, f) => sum + f.amount, 0)

    // Apply discount proportion to taxable base
    const discountRatio = baseTuition > 0 ? totalDiscountAmount / baseTuition : 0
    const taxableAfterDiscount = round2(taxableBase * (1 - discountRatio))

    taxAmount = round2(taxableAfterDiscount * input.taxRule.rate)

    if (taxAmount > 0) {
      lines.push({
        lineType: 'tax',
        descriptionEn: input.taxRule.name_en,
        descriptionAr: input.taxRule.name_ar,
        unitAmount: taxAmount,
        quantity: 1,
        lineTotal: taxAmount,
        displayOrder: order++,
      })
    }
  }

  // ---- ADDON LINES ----
  let addonsTotal = 0
  for (const addon of input.addons) {
    addonsTotal += addon.amount
    lines.push({
      lineType: 'addon',
      descriptionEn: addon.descriptionEn,
      descriptionAr: addon.descriptionAr,
      addonPackageId: addon.addonPackageId,
      unitAmount: addon.amount,
      quantity: 1,
      lineTotal: addon.amount,
      displayOrder: order++,
    })
  }

  // ---- TRANSPORT LINE ----
  if (input.transport) {
    addonsTotal += input.transport.amount
    lines.push({
      lineType: 'transport',
      descriptionEn: input.transport.descriptionEn,
      descriptionAr: input.transport.descriptionAr,
      transportZoneId: input.transport.transportZoneId,
      unitAmount: input.transport.amount,
      quantity: 1,
      lineTotal: input.transport.amount,
      displayOrder: order++,
    })
  }

  const studentTotal = round2(netTuition + taxAmount + addonsTotal)

  return {
    studentName: input.studentName,
    studentType: input.studentType,
    gradeId: input.gradeId,
    gradeNameEn: input.gradeNameEn,
    gradeNameAr: input.gradeNameAr,
    lines,
    baseTuition,
    discountAmount: totalDiscountAmount,
    taxAmount,
    addonsTotal,
    studentTotal,
  }
}

// Round to 2 decimal places (currency precision)
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
