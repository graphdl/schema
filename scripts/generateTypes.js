import { promises as fs } from 'node:fs'
import { getThings } from './generateThings.js'

const generateTypes = async () => {
  let { things, properties, actions } = await getThings()
  things.ThreeDimensionalModel = things['3DModel']
  delete things['3DModel']
  let types = ''

  const propertyTypes = {}
  for (const propertyName in properties) {
    const property = properties[propertyName]
    properties[propertyName].comment = (typeof property.comment === 'string' ? property.comment : property.comment['@value']).replaceAll('\n', ' ')
    propertyTypes[propertyName] = Array.isArray(property.type) ? property.type.join(' | ') : property.type
  }
  const baseTypes = `
export type String = string
export type Boolean = boolean
export type Text = string
export type Number = number
export type DateTime = Date
export type Time = Date

export type Things = ${Object.keys(things).sort().join(' | ')}
export type Properties = '${Object.keys(properties).sort().join(`' | '`)}'
export type Actions = '${Object.keys(actions).sort().join(`' | '`)}'

  `
  for (let thingName in things) {
    const thing = things[thingName]
    const comment = (typeof thing.comment === 'string' ? thing.comment : thing.comment['@value']).replaceAll('\n', ' ')
    const propertiesComments = Object.keys(thing.properties).map(property => ` * @property {${propertyTypes[property]}} ${properties[property].comment}`)
    const thingProperties = Object.keys(thing.properties)
    let parentTypes = thingName === 'Thing' ? '' : thing.parents.flat().join(' & ') + ' & '
    parentTypes = parentTypes.replace('rdfs:Class', 'any')
    console.log(propertiesComments)
    types += `

/**
 * ${comment}${propertiesComments.length > 0 ? '\n' + propertiesComments.join('\n') : ''}
 */
export type ${thingName} = '${thingName}' | ${parentTypes}${thing.properties && `{
  is: '${thingName}'${thingProperties.length == 0 ? '' : '\n  ' + thingProperties.map(property => `${property}?: ${propertyTypes[property]}`).join('\n  ')}
}`}

`
  }

  await fs.writeFile('./types/Things.ts', baseTypes + types)
}

generateTypes()

