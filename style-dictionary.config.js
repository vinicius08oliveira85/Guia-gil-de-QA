/**
 * Style Dictionary Configuration
 * Converte design tokens em CSS e Tailwind config
 * 
 * Documentação: https://amzn.github.io/style-dictionary/
 */
export default {
  source: ['tokens/design-tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'tokens/generated/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'tokens/generated/',
      files: [
        {
          destination: 'tailwind-tokens.js',
          format: 'javascript/es6',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};

