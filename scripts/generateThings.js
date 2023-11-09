const graph = await fetch('https://schema.org/version/latest/schemaorg-current-https.jsonld').then(r => r.json()).then(r => r['@graph'])


const schemaThings = graph.filter(t => t['@type'] === 'rdfs:Class')
const schemaProperties = graph.filter(t => t['@type'] === 'rdf:Property')
const schemaActions = schemaThings.filter(t => t['@id'].endsWith('Action'))

const things = {}
const properties = {}
const actions = {}

export const getThings = async () => {

  // Do first pass of Things to get all `things`
  for (const thing of schemaThings) {
    const id = thing['@id'].replace('schema:', '')
    const parent = thing['rdfs:subClassOf'] ? Array.isArray(thing['rdfs:subClassOf']) ? thing['rdfs:subClassOf'].map(p => p['@id'].replace('schema:', '')) : thing['rdfs:subClassOf']['@id'].replace('schema:', '') : undefined
    things[id] = {
      type: id,
      comment: thing['rdfs:comment'],
      parent: parent,
      parents: [],
      children: [],
      properties: [],
      inheritedProperties: [],
      // properties: {},
      // inheritedProperties: {},
      // introducedProperties: [],
      actions: [],
      introducedActions: [],
      inheritedActions: [],
    }
  }

  // Get all `properties`
  for (const property of schemaProperties) {
    const id = property['@id'].replace('schema:', '')
    properties[id] = {
      property: id,
      type: property['schema:rangeIncludes'] ? Array.isArray(property['schema:rangeIncludes']) ? property['schema:rangeIncludes'].map(p => p['@id'].replace('schema:', '')) : property['schema:rangeIncludes']['@id'].replace('schema:', '') : undefined,
      comment: property['rdfs:comment'],
      propertyOf: property['schema:domainIncludes'] ? Array.isArray(property['schema:domainIncludes']) ? property['schema:domainIncludes'].map(p => p['@id'].replace('schema:', '')) : property['schema:domainIncludes']['@id'].replace('schema:', '') : undefined,
    }

    // Add properties to things
    const propertyOf = properties[id].propertyOf
    if (propertyOf) {
      if (Array.isArray(propertyOf)) {
        for (const thing of propertyOf) {
          things[thing].properties[id] = properties[id].type
          // things[thing].introducedProperties.push(id)
        }
      } else {
        things[propertyOf].properties[id] = properties[id].type
        // things[propertyOf].introducedProperties.push(id)
      }
    }

  }

  // Get all `actions`
  for (const action of schemaActions) {
    let id = action['@id'].replace('schema:', '').replace('Action', '')
    if (id === '') id = 'Action'
    const parent = action['rdfs:subClassOf'] ? Array.isArray(action['rdfs:subClassOf']) ? action['rdfs:subClassOf'].map(p => p['@id'].replace('schema:', '')) : action['rdfs:subClassOf']['@id'].replace('schema:', '') : undefined
    actions[id] = {
      type: id,
      comment: action['rdfs:comment'],
      parent: parent,
      parents: [],
      related: [... action['rdfs:comment'].matchAll(/\[\[([^\[\]]+)\]\]/g)].map(m => m[1]),
      schema: action,
    }
  }


  const addParents = (thing, parent) => {
    things[thing].parents.push(parent)
    things[thing].inheritedProperties?.push(...things[parent]?.properties ?? [])
    // Object.entries(things[parent]?.properties ?? {}).forEach(([key, value]) => {
    //   things[thing].inheritedProperties[key] = value
    // })
    if (things[parent]?.parent) {
      if (Array.isArray(things[parent].parent)) {
        things[parent].parent.map(p => addParents(thing, p))
      } else {
        addParents(thing, things[parent].parent)
      }
    }
  }

  // Do a second pass of Things to add all parents, children, and inherited properties
  for (const thing of Object.values(things)) {
    // recursively add parents
    addParents(thing.type, thing.parent)
    things[thing.parent]?.children.push(thing.type)
  }



  return { things, properties, actions}
}

