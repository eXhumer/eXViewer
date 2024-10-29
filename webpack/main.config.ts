import type { Configuration } from 'webpack';

import { rules } from './rules';
import { plugins } from './plugins';

export const mainConfig: Configuration = {
  entry: './src/index.ts',
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.sass', '.json'],
  },
};
