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
              // https://sass-lang.com/d/mixed-decls (deprecation warning since 1.77.7)
              // https://sass-lang.com/d/import (deprecation warning since 1.80.0, will break from 3.0.0)
              // https://sass-lang.com/d/color-functions/ (deprecation warning since 1.79.0, will break from 2.0.0)
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
              // https://sass-lang.com/d/mixed-decls (deprecation warning since 1.77.7)
              // https://sass-lang.com/d/import (deprecation warning since 1.80.0, will break from 3.0.0)
              // https://sass-lang.com/d/color-functions/ (deprecation warning since 1.79.0, will break from 2.0.0)
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
