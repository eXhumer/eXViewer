import type { Configuration } from 'webpack';

import { rules } from './rules';
import { plugins } from './plugins';

rules.push({
  test: /\.s[ac]ss$/,
  oneOf: [
    {
      test: /\.module\.s[ac]ss$/,
      use: [
        {
          loader: 'style-loader',
          options: {
            esModule: false,
          },
        },
        {
          loader: 'css-loader',
          options: {
            esModule: false,
            modules: {
              exportLocalsConvention: 'as-is'
            },
          },
        },
        {
          loader: 'sass-loader',
          options: {
            api: 'modern',
            sassOptions: {
              silenceDeprecations: ['mixed-decls', 'import', 'global-builtin', 'color-functions'],
            },
          },
        },
      ],
    },
    {
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'sass-loader',
          options: {
            api: 'modern',
            sassOptions: {
              silenceDeprecations: ['mixed-decls', 'import', 'global-builtin', 'color-functions'],
            },
          },
        }],
    }
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.scss', '.sass'],
  },
};
