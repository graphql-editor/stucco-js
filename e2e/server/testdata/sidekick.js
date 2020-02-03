const sidekicks = [
  {
    name: 'Robin',
    hero: 'Batman',
  }
].map(v => ({...v, __typename: 'Sidekick'}))
module.exports = (input) => {
  let name = (input.source || {}).sidekick
  if (input && input.arguments && typeof input.arguments.name === 'string') {
    name = input.arguments.name
  }
  return sidekicks.find(v => v.name === name)
}