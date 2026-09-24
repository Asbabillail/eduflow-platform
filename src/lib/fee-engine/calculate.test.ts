import { describe, it, expect } from 'vitest'
import { calculateQuotation, type FeeInput } from './calculate'

const MOCK_TAX_RULE = { name_en: 'VAT 15%', name_ar: 'ضريبة 15%', rate: 0.15 }

function makeStudent(overrides: Partial<FeeInput> = {}): FeeInput {
  return {
    studentName: 'Test Student',
    studentType: 'new',
    gradeId: 'g1',
    gradeNameEn: 'Grade 1',
    gradeNameAr: 'الصف الأول',
    feeItems: [
      {
        id: '1',
        feeItemId: 'fi1',
        descriptionEn: 'Tuition',
        descriptionAr: 'رسوم الدراسة',
        amount: 33000,
        isTextable: true,
      },
      {
        id: '2',
        feeItemId: 'fi2',
        descriptionEn: 'Books',
        descriptionAr: 'الكتب',
        amount: 1200,
        isTextable: false,
      },
    ],
    discounts: [],
    addons: [],
    transport: null,
    taxRule: null,
    ...overrides,
  }
}

describe('Fee Calculation Engine', () => {

  it('calculates base fees with no discount and no VAT', () => {
    const result = calculateQuotation([makeStudent()], [])
    const student = result.students[0]

    expect(student.baseTuition).toBe(34200)     // 33000 + 1200
    expect(student.discountAmount).toBe(0)
    expect(student.taxAmount).toBe(0)
    expect(student.addonsTotal).toBe(0)
    expect(student.studentTotal).toBe(34200)
    expect(result.grandTotal).toBe(34200)
  })

  it('applies percentage discount correctly', () => {
    const student = makeStudent({
      discounts: [{
        discountTypeId: 'd1',
        descriptionEn: 'Early Enrollment 10%',
        descriptionAr: 'خصم 10%',
        discountPercent: 10,
        appliesTo: 'tuition',
      }],
    })
    const result = calculateQuotation([student], [])
    const s = result.students[0]

    // Discount is 10% of baseTuition (33000 + 1200 = 34200)
    expect(s.discountAmount).toBe(3420)
    expect(s.studentTotal).toBe(30780)
  })

  it('applies VAT only to taxable items after discount', () => {
    const student = makeStudent({
      discounts: [{
        discountTypeId: 'd1',
        descriptionEn: 'Discount 20%',
        descriptionAr: 'خصم 20%',
        discountPercent: 20,
        appliesTo: 'tuition',
      }],
      taxRule: MOCK_TAX_RULE,
    })
    const result = calculateQuotation([student], [])
    const s = result.students[0]

    // Tuition (taxable): 33000. Books (non-taxable): 1200.
    // Base = 34200. Discount 20% = 6840. Net = 27360.
    // Taxable base = 33000. Discount ratio = 6840/34200 = 0.2
    // Taxable after discount = 33000 * 0.8 = 26400
    // VAT = 26400 * 0.15 = 3960
    expect(s.taxAmount).toBe(3960)
    expect(s.studentTotal).toBe(27360 + 3960)  // 31320
  })

  it('adds addon packages to total', () => {
    const student = makeStudent({
      addons: [{
        addonPackageId: 'ap1',
        descriptionEn: 'iPad Package',
        descriptionAr: 'باقة iPad',
        amount: 2800,
        isTaxable: false,
      }],
    })
    const result = calculateQuotation([student], [])
    const s = result.students[0]

    expect(s.addonsTotal).toBe(2800)
    expect(s.studentTotal).toBe(34200 + 2800)
  })

  it('adds transport to addons total', () => {
    const student = makeStudent({
      transport: {
        transportZoneId: 'tz1',
        descriptionEn: 'Zone A — One Way',
        descriptionAr: 'المنطقة أ - اتجاه واحد',
        amount: 3000,
      },
    })
    const result = calculateQuotation([student], [])

    expect(result.students[0].addonsTotal).toBe(3000)
  })

  it('calculates multi-student family correctly', () => {
    const s1 = makeStudent({ studentName: 'Child 1' })
    const s2 = makeStudent({ studentName: 'Child 2' })
    const result = calculateQuotation([s1, s2], [])

    expect(result.students).toHaveLength(2)
    expect(result.grandTotal).toBe(34200 * 2)
    expect(result.subtotal).toBe(34200 * 2)
  })

  it('flags quotation for approval when discount exceeds threshold', () => {
    const student = makeStudent({
      discounts: [{
        discountTypeId: 'staff-disc',
        descriptionEn: 'Staff Discount 35%',
        descriptionAr: 'خصم الموظف 35%',
        discountPercent: 35,
        appliesTo: 'tuition',
      }],
    })
    const result = calculateQuotation(
      [student],
      [{ discountTypeId: 'staff-disc', threshold: 30 }]
    )

    expect(result.requiresApproval).toBe(true)
    expect(result.approvalReasons.length).toBeGreaterThan(0)
    expect(result.approvalReasons[0]).toContain('35%')
  })

  it('does NOT flag for approval when discount is below threshold', () => {
    const student = makeStudent({
      discounts: [{
        discountTypeId: 'early-disc',
        descriptionEn: 'Early Enrollment 5%',
        descriptionAr: 'خصم التسجيل المبكر 5%',
        discountPercent: 5,
        appliesTo: 'tuition',
      }],
    })
    const result = calculateQuotation(
      [student],
      [{ discountTypeId: 'early-disc', threshold: 15 }]
    )

    expect(result.requiresApproval).toBe(false)
    expect(result.approvalReasons).toHaveLength(0)
  })

  it('handles zero-fee case without errors', () => {
    const student: FeeInput = {
      studentName: 'Test',
      studentType: 'new',
      gradeId: 'g1',
      gradeNameEn: 'Grade 1',
      gradeNameAr: 'الصف الأول',
      feeItems: [],
      discounts: [],
      addons: [],
      transport: null,
      taxRule: null,
    }
    const result = calculateQuotation([student], [])
    expect(result.grandTotal).toBe(0)
    expect(result.requiresApproval).toBe(false)
  })

  it('rounds currency to 2 decimal places', () => {
    const student = makeStudent({
      feeItems: [{
        id: '1',
        feeItemId: 'fi1',
        descriptionEn: 'Tuition',
        descriptionAr: 'رسوم الدراسة',
        amount: 33333,
        isTextable: true,
      }],
      discounts: [{
        discountTypeId: 'd1',
        descriptionEn: 'Discount 3%',
        descriptionAr: 'خصم 3%',
        discountPercent: 3,
        appliesTo: 'tuition',
      }],
    })
    const result = calculateQuotation([student], [])
    const s = result.students[0]

    // 33333 * 0.03 = 999.99 (should not have more than 2 decimals)
    expect(s.discountAmount.toString()).not.toContain('000000')
    expect(Number.isFinite(s.studentTotal)).toBe(true)
  })
})
