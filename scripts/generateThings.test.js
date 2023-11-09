import { describe, it, expect } from 'vitest'
import { getThings } from './generateThings'

describe('generateThings', () => {
  it('should generate things', async () => {
    const { things, properties, actions } = await getThings()
    expect(things).toMatchFileSnapshot('../schema/things.json5')
    expect(properties).toMatchFileSnapshot('../schema/properties.json5')
    expect(actions).toMatchFileSnapshot('../schema/actions.json5')
  })
})