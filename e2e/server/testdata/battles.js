const battles = [
  {
    when: new Date(2020, 1, 1, 0, 1, 0, 0).toUTCString(),
    participants: [
      {
        members: [
          {
            __typename: 'Hero',
            name: 'Batman',
            sidekick: 'Robin',
          },
          {
            __typename: 'Sidekick',
            name: 'Robin',
            hero: 'Batman',
          },
        ],
      },
      {
        members: [
          {
            __typename: 'Vilian',
            name: 'Joker',
          },
        ],
      },
    ],
  },
];

module.exports = (input) => {
  const when = input.arguments && input.arguments.when;
  if (when) {
    return battles.filter((battle) => battle.when === when.substr('parsed date: '.length));
  }
  return battles;
};
