const heroes = [
  {
    name: 'Batman',
    sidekick: 'Robin',
  }
].map(v => ({...v, __typename: 'Hero'}))
module.exports = (input) => {
  let name = (input.source || {}).hero
  if (input && input.arguments && typeof input.arguments.name === 'string') {
    name = input.arguments.name
  }
  return heroes.find(v => v.name === name)
}