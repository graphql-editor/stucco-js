const search = [
  {
    name: 'Batman',
    sidekick: 'Robin',
  }
].map(v => ({...v, __typename: 'Hero'})).concat(
  [
    {
      name: 'Robin',
      hero: 'Batman',
    }
  ].map(v => ({...v, __typename: 'Sidekick'}))
).concat(
  [
    {
      name: 'Joker',
    }
  ].map(v => ({...v, __typename: 'Vilian'})),
);
module.exports = (input) => {
  return search.find(v => v.name === input.arguments.name)
}