import { afterEach, describe, expect, it } from 'vitest'

import {
  clearProductDraft,
  loadProductDraft,
  PRODUCT_DRAFT_KEY,
  saveProductDraft,
} from './productDraft.ts'
import { EMPTY_PRODUCT_VALUES } from './productOptions.ts'

describe('productDraft', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns undefined when nothing is saved', () => {
    expect(loadProductDraft()).toBeUndefined()
  })

  it('saves, loads and clears a draft', () => {
    const values = { ...EMPTY_PRODUCT_VALUES, name: 'RCC Cement', ecoFriendly: true }

    expect(saveProductDraft(values)).toBe(true)
    expect(loadProductDraft()).toEqual(values)

    clearProductDraft()
    expect(loadProductDraft()).toBeUndefined()
  })

  it('ignores broken JSON and fields with the wrong type', () => {
    localStorage.setItem(PRODUCT_DRAFT_KEY, '{not json')
    expect(loadProductDraft()).toBeUndefined()

    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify({ name: 42, uom: 'Per Bag' }))
    expect(loadProductDraft()).toEqual({ ...EMPTY_PRODUCT_VALUES, uom: 'Per Bag' })
  })
})
