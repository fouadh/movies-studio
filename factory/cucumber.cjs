const common = {
  paths: ['spec/features/**/*.feature'],
  import: ['steps/**/*.ts'],
};

module.exports = {
  default: { ...common, tags: 'not @real-agent' },
  'real-agent': { ...common, tags: '@real-agent' },
};
